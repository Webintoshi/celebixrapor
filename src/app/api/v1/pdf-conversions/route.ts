import { handlePdfConversionRequest } from "@/lib/pdf-conversion-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePdfConversionRequest(request);
}
