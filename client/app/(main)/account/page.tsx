import { redirect } from "next/navigation";

// /account সরাসরি খুললে Profile-এ যায়
export default function AccountIndex() {
  redirect("/account/profile");
}
