import { auth } from "@/constants/firebase";
import { Redirect } from "expo-router";

export default function Index() {
  const user = auth.currentUser;

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
