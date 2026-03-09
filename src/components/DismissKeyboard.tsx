import { ReactNode } from "react";
import { Keyboard, Pressable, View } from "react-native";

export function DismissKeyboard({ children }: { children: ReactNode }) {
  return (
    <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}
