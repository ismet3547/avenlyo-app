import type { Language } from "./agents.ts";
// Canonical policy messages: these never assert that a notification was sent.
export const customerPauseReplies: Record<Language, string> = {
  en: "A team member can continue this conversation. Automated answers are paused.",
  tr: "Bir ekip üyesi bu görüşmeye devam edebilir. Otomatik yanıtlar duraklatıldı.",
  de: "Ein Teammitglied kann dieses Gespräch fortsetzen. Automatische Antworten sind pausiert.",
  fr: "Un membre de l’équipe peut poursuivre cette conversation. Les réponses automatiques sont suspendues.",
  es: "Un miembro del equipo puede continuar esta conversación. Las respuestas automáticas están en pausa.",
  it: "Un membro del team può continuare questa conversazione. Le risposte automatiche sono in pausa.",
  pt: "Um membro da equipa pode continuar esta conversa. As respostas automáticas estão em pausa.",
  nl: "Een teamlid kan dit gesprek voortzetten. Automatische antwoorden zijn gepauzeerd.",
  ar: "يمكن لأحد أعضاء الفريق متابعة هذه المحادثة. تم إيقاف الردود الآلية مؤقتًا.",
  ru: "Сотрудник команды может продолжить этот разговор. Автоматические ответы приостановлены.",
  uk: "Співробітник команди може продовжити цю розмову. Автоматичні відповіді призупинено.",
  pl: "Członek zespołu może kontynuować tę rozmowę. Automatyczne odpowiedzi są wstrzymane.",
  ro: "Un membru al echipei poate continua această conversație. Răspunsurile automate sunt suspendate.",
  el: "Ένα μέλος της ομάδας μπορεί να συνεχίσει αυτή τη συνομιλία. Οι αυτόματες απαντήσεις έχουν τεθεί σε παύση.",
  bg: "Член на екипа може да продължи този разговор. Автоматичните отговори са на пауза.",
  sv: "En medarbetare kan fortsätta det här samtalet. Automatiska svar är pausade.",
  da: "En medarbejder kan fortsætte denne samtale. Automatiske svar er sat på pause.",
  no: "En medarbeider kan fortsette denne samtalen. Automatiske svar er satt på pause.",
  fi: "Tiimin jäsen voi jatkaa tätä keskustelua. Automaattiset vastaukset on keskeytetty.",
  cs: "Člen týmu může pokračovat v této konverzaci. Automatické odpovědi jsou pozastaveny.",
  hu: "A csapat egyik tagja folytathatja ezt a beszélgetést. Az automatikus válaszok szünetelnek.",
  he: "חבר צוות יכול להמשיך בשיחה הזו. התשובות האוטומטיות מושהות.",
  hi: "टीम का कोई सदस्य इस बातचीत को आगे बढ़ा सकता है। स्वचालित उत्तर रोक दिए गए हैं।",
  bn: "দলের একজন সদস্য এই কথোপকথন চালিয়ে যেতে পারেন। স্বয়ংক্রিয় উত্তর সাময়িকভাবে বন্ধ আছে।",
  ur: "ٹیم کا کوئی رکن یہ گفتگو جاری رکھ سکتا ہے۔ خودکار جوابات عارضی طور پر روک دیے گئے ہیں۔",
  fa: "یکی از اعضای تیم می‌تواند این گفتگو را ادامه دهد. پاسخ‌های خودکار موقتاً متوقف شده‌اند.",
  zh: "团队成员可以继续此对话。自动回复已暂停。",
  ja: "チームの担当者がこの会話を続けることができます。自動応答は一時停止しています。",
  ko: "팀 담당자가 이 대화를 이어갈 수 있습니다. 자동 응답이 일시 중지되었습니다.",
  id: "Anggota tim dapat melanjutkan percakapan ini. Balasan otomatis dijeda.",
  ms: "Ahli pasukan boleh meneruskan perbualan ini. Balasan automatik dijeda.",
  vi: "Một thành viên trong nhóm có thể tiếp tục cuộc trò chuyện này. Trả lời tự động đã tạm dừng.",
  th: "เจ้าหน้าที่ในทีมสามารถสนทนาต่อได้ การตอบกลับอัตโนมัติหยุดชั่วคราวแล้ว",
  sw: "Mwanachama wa timu anaweza kuendeleza mazungumzo haya. Majibu ya kiotomatiki yamesitishwa kwa muda.",
  af: "'n Spanlid kan hierdie gesprek voortsit. Outomatiese antwoorde is onderbreek.",
  sr: "Član tima može da nastavi ovaj razgovor. Automatski odgovori su pauzirani.",
  hr: "Član tima može nastaviti ovaj razgovor. Automatski odgovori su pauzirani.",
  sk: "Člen tímu môže pokračovať v tejto konverzácii. Automatické odpovede sú pozastavené.",
  sl: "Član ekipe lahko nadaljuje ta pogovor. Samodejni odgovori so začasno ustavljeni.",
  lt: "Komandos narys gali tęsti šį pokalbį. Automatiniai atsakymai pristabdyti.",
  lv: "Komandas dalībnieks var turpināt šo sarunu. Automātiskās atbildes ir apturētas.",
  et: "Meeskonnaliige saab seda vestlust jätkata. Automaatsed vastused on peatatud.",
  ca: "Un membre de l’equip pot continuar aquesta conversa. Les respostes automàtiques estan en pausa.",
  fil: "Maaaring ipagpatuloy ng isang miyembro ng team ang pag-uusap na ito. Naka-pause ang mga awtomatikong sagot.",
};
export function fixedPauseReply(language: Language, test: boolean) {
  return test
    ? language === "en"
      ? "This test conversation is paused for human assistance. No automatic customer answer has been sent."
      : `Test: ${customerPauseReplies[language]}`
    : customerPauseReplies[language];
}
