import {
useEffect,
useState,
} from "react";

import { getQuestions } from "../data-layer";

export default function MixedExamPage(){

const [questions,
setQuestions] =
useState([]);

useEffect(()=>{

async function load(){

const params =
new URLSearchParams(
window.location.search
);

const count =
parseInt(
params.get("count")
|| 10
);

let data = await getQuestions();

// shuffle

data = data.sort(()=>
Math.random()-0.5
);

setQuestions(
data.slice(0,count)
);

}

load();

},[]);

return(

<div className="page">

<h1>
Mixed Mock Test
</h1>

{questions.map((q,index)=>(

<div
key={q.id}
className="card"
>

<h3>
{index+1}. {q.question}
</h3>

<div className="option-line">

<span>
A) {q.options?.[0]}
</span>

<span>
B) {q.options?.[1]}
</span>

<span>
C) {q.options?.[2]}
</span>

<span>
D) {q.options?.[3]}
</span>

</div>

</div>

))}

</div>
);
}
