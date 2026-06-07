import{aR as useAuth,aV as useNavigate,ap as React,ai as jsx,j as TopNav}from"./index-BoFT11kD.js";
import{g as getRevisionPool}from"./revision-AT56w92r.js";

const ANSWER_INDEX={A:0,B:1,C:2,D:3};

function correctIndex(q){
  if(typeof q?.correctAnswer==="number")return q.correctAnswer;
  if(typeof q?.correct_answer==="number")return q.correct_answer;
  const raw=q?.correctAnswer??q?.correct_answer??q?.answer;
  if(typeof raw==="string"){
    const key=raw.trim().toUpperCase();
    if(key in ANSWER_INDEX)return ANSWER_INDEX[key];
    const asNumber=Number(key);
    if(Number.isFinite(asNumber))return asNumber;
  }
  return 0;
}

function optionState(question,index,selected,revealed){
  if(!revealed)return selected===index?" ep-option--selected":"";
  const correct=correctIndex(question);
  if(index===correct)return" ep-option--correct";
  if(selected===index&&index!==correct)return" ep-option--wrong";
  return"";
}

function RevisionPage(){
  const{user,loading}=useAuth();
  const navigate=useNavigate();
  const[data,setData]=React.useState({questions:[],stats:null});
  const[isLoading,setIsLoading]=React.useState(true);
  const[current,setCurrent]=React.useState(0);
  const[answers,setAnswers]=React.useState({});
  const[revealed,setRevealed]=React.useState({});

  React.useEffect(()=>{
    if(loading)return;
    if(!user){navigate("/login");return}
    let cancelled=false;
    setIsLoading(true);
    getRevisionPool(user.id).then(result=>{if(!cancelled)setData(result)}).finally(()=>{if(!cancelled)setIsLoading(false)});
    return()=>{cancelled=true};
  },[user,loading,navigate]);

  if(isLoading){
    return jsx.jsxs("div",{className:"page",children:[jsx.jsx(TopNav,{}),jsx.jsx("div",{className:"loading-overlay",children:jsx.jsx("div",{className:"loading-spinner"})})]});
  }

  const questions=data.questions||[];
  const question=questions[current];
  const selected=question?answers[question.id]:undefined;
  const isRevealed=question?!!revealed[question.id]:false;
  const solved=isRevealed&&selected===correctIndex(question);
  const completed=questions.filter(q=>revealed[q.id]&&answers[q.id]===correctIndex(q)).length;

  return jsx.jsxs("div",{className:"page",children:[
    jsx.jsx(TopNav,{}),
    jsx.jsxs("div",{className:"revision-header",children:[
      jsx.jsxs("div",{children:[
        jsx.jsx("h2",{children:"Revision Mode"}),
        jsx.jsx("p",{children:"Wrong and skipped questions from your attempts. Reattempt them until you get them right."})
      ]}),
      jsx.jsxs("div",{className:"revision-stats",children:[
        jsx.jsxs("div",{className:"stat-chip",children:[jsx.jsx("span",{children:"Queue"}),jsx.jsx("strong",{children:questions.length})]}),
        jsx.jsxs("div",{className:"stat-chip",children:[jsx.jsx("span",{children:"Solved"}),jsx.jsx("strong",{children:completed})]}),
        jsx.jsxs("div",{className:"stat-chip",children:[jsx.jsx("span",{children:"Attempts"}),jsx.jsx("strong",{children:data.stats?.attempts||0})]})
      ]})
    ]}),
    questions.length===0?jsx.jsxs("div",{className:"empty-state",children:[
      jsx.jsx("h3",{children:"Nothing to revise yet"}),
      jsx.jsx("p",{children:"Take a few mock exams. Wrong and skipped questions will show up here."}),
      jsx.jsx("button",{className:"btn-primary",onClick:()=>navigate("/exams"),children:"Browse Exams"})
    ]}):jsx.jsxs("div",{className:"ep-body",children:[
      jsx.jsxs("main",{className:"ep-main",children:[
        jsx.jsxs("div",{className:"exam-question-header",children:[
          jsx.jsxs("div",{className:"exam-q-label",children:[
            jsx.jsx("span",{className:"exam-q-badge",children:`Q${current+1}`}),
            jsx.jsx("span",{className:"exam-q-count",children:`${current+1} / ${questions.length}`})
          ]}),
          jsx.jsx("span",{className:`badge-soft ${question._reason==="wrong"?"badge-danger":"badge-warning"}`,children:question._reason==="wrong"?"Previously wrong":"Skipped"})
        ]}),
        jsx.jsxs("div",{className:"ep-question-wrap",children:[
          jsx.jsx("span",{className:"ep-q-badge",children:current+1}),
          jsx.jsx("div",{className:"ep-question-text",dangerouslySetInnerHTML:{__html:question.question||""}})
        ]}),
        jsx.jsx("div",{className:"ep-options",children:(question.options||[]).map((option,index)=>jsx.jsxs("button",{
          type:"button",
          className:`ep-option${optionState(question,index,selected,isRevealed)}`,
          onClick:()=>{setAnswers(prev=>({...prev,[question.id]:index}));setRevealed(prev=>({...prev,[question.id]:false}))},
          children:[
            jsx.jsx("span",{className:"ep-option-radio",children:jsx.jsx("span",{className:selected===index?"ep-radio-filled":"ep-radio-empty"})}),
            jsx.jsx("span",{className:"ep-option-letter",children:String.fromCharCode(65+index)}),
            jsx.jsx("span",{className:"ep-option-text",children:option})
          ]
        },index))}),
        isRevealed&&jsx.jsxs("div",{className:`revision-feedback ${solved?"revision-feedback--correct":"revision-feedback--wrong"}`,children:[
          jsx.jsx("strong",{children:solved?"Correct. Nice recovery.":"Not quite. Check the correct answer and try again."}),
          question.explanation&&jsx.jsx("p",{children:question.explanation})
        ]}),
        jsx.jsxs("div",{className:"ep-action-bar",children:[
          jsx.jsx("button",{className:"ep-btn ep-btn-outline",disabled:current===0,onClick:()=>setCurrent(v=>Math.max(0,v-1)),children:"Previous"}),
          jsx.jsx("button",{className:"ep-btn ep-btn-outline",disabled:selected===undefined,onClick:()=>setRevealed(prev=>({...prev,[question.id]:!prev[question.id]})),children:isRevealed?"Hide Answer":"Check Answer"}),
          jsx.jsx("button",{className:"ep-btn ep-btn-outline",onClick:()=>{setAnswers(prev=>{const next={...prev};delete next[question.id];return next});setRevealed(prev=>({...prev,[question.id]:false}))},children:"Reattempt"}),
          jsx.jsx("button",{className:"ep-btn ep-btn-submit",disabled:current===questions.length-1,onClick:()=>setCurrent(v=>Math.min(questions.length-1,v+1)),children:"Next"})
        ]})
      ]}),
      jsx.jsxs("aside",{className:"ep-aside",children:[
        jsx.jsx("h3",{className:"ep-aside-title",children:"Question Palette"}),
        jsx.jsxs("div",{className:"ep-legend",children:[
          jsx.jsxs("div",{className:"ep-legend-item",children:[jsx.jsx("span",{className:"ep-legend-badge ep-badge-answered",children:"1"}),jsx.jsx("span",{className:"ep-legend-label",children:"Solved"})]}),
          jsx.jsxs("div",{className:"ep-legend-item",children:[jsx.jsx("span",{className:"ep-legend-badge ep-badge-not-answered",children:"1"}),jsx.jsx("span",{className:"ep-legend-label",children:"Tried"})]}),
          jsx.jsxs("div",{className:"ep-legend-item",children:[jsx.jsx("span",{className:"ep-legend-badge ep-badge-not-visited",children:"1"}),jsx.jsx("span",{className:"ep-legend-label",children:"Pending"})]}),
          jsx.jsxs("div",{className:"ep-legend-item",children:[jsx.jsx("span",{className:"ep-legend-badge ep-badge-marked",children:"1"}),jsx.jsx("span",{className:"ep-legend-label",children:"Current"})]})
        ]}),
        jsx.jsx("div",{className:"ep-qgrid",children:questions.map((q,index)=>{
          const answered=answers[q.id]!==undefined;
          const right=revealed[q.id]&&answers[q.id]===correctIndex(q);
          const cls=`ep-qcell ${right?"ep-qcell--answered":answered?"ep-qcell--not-answered":"ep-qcell--unvisited"} ${current===index?"ep-qcell--current":""}`;
          return jsx.jsx("button",{type:"button",className:cls,onClick:()=>setCurrent(index),children:index+1},q.id);
        })})
      ]})
    ]})
  ]});
}

export{RevisionPage as default};
