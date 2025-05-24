export const escapeMarkdownV2 = (text: string): string => {
  return text.replace(/([_*$begin:math:display$$end:math:display$()~`>#+\-=|{}.!\\])/g, '\\$1')
}
