import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { requireEmployee, UnauthorizedError } from "@/lib/auth/requireSession";
import { GST_RATE, QST_RATE, roundToCents } from "@/lib/tax";

const PAYMENT_METHODS = ["CASH", "CARD"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

type CartItemInput = { articleId: string; quantity: number };

function parseItems(value: unknown): CartItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const items: CartItemInput[] = [];
  for (const raw of value) {
    const articleId = typeof raw?.articleId === "string" ? raw.articleId : "";
    const quantity = typeof raw?.quantity === "number" ? raw.quantity : NaN;
    if (!articleId || !Number.isInteger(quantity) || quantity < 1) return null;
    items.push({ articleId, quantity });
  }
  return items;
}

// Ventes filtrables par période pour /sales (dashboard jour/semaine/mois/année).
export async function GET(request: Request) {
  try {
    await requireEmployee();

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const sales = await withPrisma((prisma) =>
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: from ? new Date(from) : undefined,
            lte: to ? new Date(to) : undefined,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          employee: { select: { firstName: true, lastName: true } },
          items: true,
        },
      })
    );

    return NextResponse.json({ sales });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireEmployee();

    const body = (await request.json().catch(() => null)) as
      | {
          items?: unknown;
          paymentMethod?: unknown;
          requiresDelivery?: unknown;
          deliveryNote?: unknown;
        }
      | null;

    const items = parseItems(body?.items);
    const paymentMethod = isPaymentMethod(body?.paymentMethod) ? body.paymentMethod : null;
    const requiresDelivery = typeof body?.requiresDelivery === "boolean" ? body.requiresDelivery : false;
    const deliveryNote = typeof body?.deliveryNote === "string" ? body.deliveryNote.trim() || null : null;

    if (!items || !paymentMethod) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const articleIds = [...new Set(items.map((item) => item.articleId))];
    const articles = await withPrisma((prisma) =>
      prisma.article.findMany({
        where: { id: { in: articleIds } },
        include: { artist: { select: { id: true, name: true, commissionRate: true } } },
      })
    );

    if (articles.length !== articleIds.length) {
      return NextResponse.json({ error: "article_not_found" }, { status: 400 });
    }
    const articleById = new Map(articles.map((article) => [article.id, article]));

    // Tout est recalculé ici à partir du catalogue actuel — jamais depuis un
    // prix envoyé par le client — puis figé sur chaque SaleItem.
    let subtotal = 0;
    let taxableSubtotal = 0;
    const saleItemsData = items.map(({ articleId, quantity }) => {
      const article = articleById.get(articleId)!;
      const unitPrice = Number(article.price);
      const lineTotal = roundToCents(unitPrice * quantity);
      subtotal = roundToCents(subtotal + lineTotal);
      if (article.taxable) {
        taxableSubtotal = roundToCents(taxableSubtotal + lineTotal);
      }

      const commissionRate = article.artist ? Number(article.artist.commissionRate) : null;
      const commissionAmount = commissionRate !== null ? roundToCents(lineTotal * (commissionRate / 100)) : null;

      return {
        articleId: article.id,
        articleTitle: article.title,
        unitPrice,
        quantity,
        artistId: article.artist?.id ?? null,
        artistName: article.artist?.name ?? null,
        commissionRate,
        commissionAmount,
      };
    });

    const gstAmount = roundToCents(taxableSubtotal * GST_RATE);
    const qstAmount = roundToCents(taxableSubtotal * QST_RATE);
    const total = roundToCents(subtotal + gstAmount + qstAmount);

    const sale = await withPrisma((prisma) =>
      prisma.sale.create({
        data: {
          employeeId: session.employeeId,
          paymentMethod,
          subtotal,
          gstAmount,
          qstAmount,
          total,
          requiresDelivery,
          deliveryNote,
          items: { create: saleItemsData },
        },
        include: { items: true },
      })
    );

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
