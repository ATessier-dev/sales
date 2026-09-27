import { NextResponse } from "next/server";
import { requireSuperuserCode, UnauthorizedError, ForbiddenError } from "@/lib/auth/superuserCode";
import { importEmployeesFromClockin } from "@/lib/clockin";

export async function POST(request: Request) {
  try {
    await requireSuperuserCode(request);

    const result = await importEmployeesFromClockin();

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "import_failed" }, { status: 502 });
  }
}
