/**
 * Posts provided code to hastebin
 * @param code
 * @param ts Whether the code is in TS
 */
export const postToHaste = async (code: any, ts?: boolean): Promise<string> => {
  const req = await fetch("https://hst.sh/documents/", {
    method: "POST",
    body: typeof code === "object" ? JSON.stringify(code, null, 2) : code,
  });
  if (req.status !== 200) throw new Error("Status code did not return 200, something went wrong.");

  const bin = await req.json();

  return `https://hst.sh/${
    (
      bin as {
        key: string;
      }
    ).key
  }.${ts ? "typescript" : "javascript"}`;
};
