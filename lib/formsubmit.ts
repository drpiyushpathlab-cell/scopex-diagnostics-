const FORM_SUBMIT_EMAIL = "scopex.lab@gmail.com";
const FORM_SUBMIT_URL = `https://formsubmit.co/ajax/${FORM_SUBMIT_EMAIL}`;

export async function submitViaFormSubmit(payload: Record<string, string | number>) {
  const response = await fetch(FORM_SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      _subject: "SCOPEX Website Lead",
      _captcha: "false",
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error("Unable to submit form. Please try again.");
  }

  const data = (await response.json()) as { success?: string | boolean; message?: string };
  const success = data?.success === true || data?.success === "true";
  if (!success) {
    throw new Error(data?.message || "Unable to submit form. Please try again.");
  }

  return true;
}
