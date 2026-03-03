import { ReactNode } from "react";
import { Keyboard, TouchableWithoutFeedback, View } from "react-native";

export function DismissKeyboard({ children }: { children: ReactNode }) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
