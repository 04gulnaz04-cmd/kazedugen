import { GeneratedContent, Language } from "../types";

const headers = {
  kk: { explanation: "Түсіндірме", slides: "Слайдтар", quiz: "Тест тапсырмалары", correct: "Дұрыс жауап" },
  ru: { explanation: "Объяснение", slides: "Слайды", quiz: "Тест", correct: "Правильный ответ" },
  en: { explanation: "Explanation", slides: "Slides", quiz: "Quiz", correct: "Correct Answer" }
};

export const downloadPDF = (content: GeneratedContent) => {
  const lang: Language = content.language || 'kk';
  const t = headers[lang] || headers.kk;

  const element = document.createElement('div');
  element.innerHTML = `
    <html>
      <head>
        <title>${content.topic}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
          h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
          h2 { color: #15803d; margin-top: 30px; }
          .quiz-item { background: #f1f5f9; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
          .answer-key { font-weight: bold; margin-top: 10px; color: #059669; }
        </style>
      </head>
      <body>
        <h1>${content.topic}</h1>
        
        <h2>${t.explanation}</h2>
        <div>${content.explanation.replace(/\n/g, '<br/>')}</div>
        
        <h2>${t.slides}</h2>
        <ul>
          ${content.slides.map(s => `<li><strong>${s.title}</strong>: ${s.bulletPoints.join(', ')}</li>`).join('')}
        </ul>

        <h2>${t.quiz}</h2>
        ${content.quiz.map((q, i) => `
          <div class="quiz-item">
            <p><strong>${i + 1}. ${q.question}</strong></p>
            <ul>
              <li>A) ${q.options.A}</li>
              <li>B) ${q.options.B}</li>
              <li>C) ${q.options.C}</li>
              <li>D) ${q.options.D}</li>
            </ul>
            <p class="answer-key">${t.correct}: ${q.correctAnswer}</p>
          </div>
        `).join('')}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(element.innerHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

export const downloadPPTX = (content: GeneratedContent) => {
    const pptData = {
        title: content.topic,
        slides: content.slides,
        language: content.language
    };
    
    const blob = new Blob([JSON.stringify(pptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.topic.replace(/\s+/g, '_')}_presentation_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("PPTX generation requires 'pptxgenjs' library. Downloaded raw slide data JSON instead for this demo.");
};