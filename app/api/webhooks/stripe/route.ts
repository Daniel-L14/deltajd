import { NextResponse } from "next/server";
function unavailable() {
  return NextResponse.json(
    { error: "Función no habilitada en esta versión." },
    { status: 501 },
  );
}
export {
  unavailable as GET,
  unavailable as POST,
  unavailable as PUT,
  unavailable as DELETE,
};
