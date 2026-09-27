import { NextResponse } from "next/server";
import { withPrisma } from "@/lib/withPrisma";
import { GST_RATE, QST_RATE, roundToCents } from "@/lib/tax";

const PAYMENT_METHODS = ["CASH", "CARD"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

type CartItemInput = { articleId: string; quantity: number; commissionId: string | null };

function parseItems(value: unknown): CartItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const items: CartItemInput[] = [];
  for (const raw of value) {
    const articleId = typeof raw?.articleId === "string" ? raw.articleId : "";
    const quantity = typeof raw?.quantity === "number" ? raw.quantity : NaN;
    const commissionId = typeof raw?.commissionId === "string" && raw.commissionId ? raw.commissionId : null;
    if (!articleId || !Number.isInteger(quantity) || quantity < 1) return null;
    items.push({ articleId, quantity, commissionId });
  }
  return items;
}

// Ventes filtrables par période pour /sales (dashboard jour/semaine/mois/année).
// Aucun code requis : /sales et /pos sont publics (voir lib/auth/superuserCode.ts,
// seul /settings est protégé).
export async function GET(request: Request) {
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
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        employeeId?: unknown;
        items?: unknown;
        paymentMethod?: unknown;
        requiresDelivery?: unknown;
        deliveryNote?: unknown;
      }
    | null;

  const employeeId = typeof body?.employeeId === "string" ? body.employeeId.trim() : "";
  const items = parseItems(body?.items);
  const paymentMethod = isPaymentMethod(body?.paymentMethod) ? body.paymentMethod : null;
  const requiresDelivery = typeof body?.requiresDelivery === "boolean" ? body.requiresDelivery : false;
  const deliveryNote = typeof body?.deliveryNote === "string" ? body.deliveryNote.trim() || null : null;

  if (!employeeId || !items || !paymentMethod) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const employee = await withPrisma((prisma) => prisma.employee.findUnique({ where: { id: employeeId } }));
  if (!employee || !employee.active) {
    return NextResponse.json({ error: "employee_not_found" }, { status: 400 });
  }

  const articleIds = [...new Set(items.map((item) => item.articleId))];
  const articles = await withPrisma((prisma) =>
    prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { artist: { select: { id: true, name: true } } },
    })
  );

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: "article_not_found" }, { status: 400 });
  }
  const articleById = new Map(articles.map((article) => [article.id, article]));

  const commissionIds = [
    ...new Set(items.map((item) => item.commissionId).filter((id): id is string => id !== null)),
  ];
  const commissions = commissionIds.length
    ? await withPrisma((prisma) => prisma.commission.findMany({ where: { id: { in: commissionIds } } }))
    : [];
  const commissionById = new Map(commissions.map((commission) => [commission.id, commission]));

  // Une ligne dont l'article a un artiste doit obligatoirement porter une
  // commission choisie par l'employé (voir la liste Commissions côté
  // /settings) ; une ligne sans artiste n'en prend jamais.
  for (const item of items) {
    const article = articleById.get(item.articleId)!;
    if (article.artist && !item.commissionId) {
      return NextResponse.json({ error: "commission_required" }, { status: 400 });
    }
    if (item.commissionId && !commissionById.has(item.commissionId)) {
      return NextResponse.json({ error: "commission_not_found" }, { status: 400 });
    }
  }

  // Tout est recalculé ici à partir du catalogue actuel — jamais depuis un
  // prix envoyé par le client — puis figé sur chaque SaleItem.
  let subtotal = 0;
  let taxableSubtotal = 0;
  const saleItemsData = items.map(({ articleId, quantity, commissionId }) => {
    const article = articleById.get(articleId)!;
    const unitPrice = Number(article.price);
    const lineTotal = roundToCents(unitPrice * quantity);
    subtotal = roundToCents(subtotal + lineTotal);
    if (article.taxable) {
      taxableSubtotal = roundToCents(taxableSubtotal + lineTotal);
    }

    const commission = article.artist && commissionId ? (commissionById.get(commissionId) ?? null) : null;
    const commissionRate = commission ? Number(commission.rate) : null;
    const commissionAmount = commissionRate !== null ? roundToCents(lineTotal * (commissionRate / 100)) : null;

    return {
      articleId: article.id,
      articleTitle: article.title,
      unitPrice,
      quantity,
      artistId: article.artist?.id ?? null,
      artistName: article.artist?.name ?? null,
      commissionId: commission?.id ?? null,
      commissionTitle: commission?.title ?? null,
      commissionRate,
      commissionAmount,
    };
  });

  const gstAmount = roundToCents(taxableSubtotal * GST_RATE);
  const qstAmount = roundToCents(taxableSubtotal * QST_RATE);
  const total = roundToCents(subtotal + gstAmount + qstAmount);

  // Commission vendeur : indépendante de la commission de provenance
  // ci-dessus, jamais déduite de celle-ci, calculée sur le sous-total avant
  // taxes au taux figé de l'employé au moment de la vente.
  const employeeCommissionRate = Number(employee.commissionRate);
  const employeeCommissionAmount = roundToCents(subtotal * (employeeCommissionRate / 100));

  const sale = await withPrisma((prisma) =>
    prisma.sale.create({
      data: {
        employeeId: employee.id,
        paymentMethod,
        subtotal,
        gstAmount,
        qstAmount,
        total,
        employeeCommissionRate,
        employeeCommissionAmount,
        requiresDelivery,
        deliveryNote,
        items: { create: saleItemsData },
      },
      include: { items: true },
    })
  );

  return NextResponse.json({ sale }, { status: 201 });
}
