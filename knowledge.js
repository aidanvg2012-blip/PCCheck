'use strict';
(() => {
 const search=document.getElementById('knowledgeSearch'),topic=document.getElementById('knowledgeTopic'),cards=[...document.querySelectorAll('.knowledge-card')],count=document.getElementById('knowledgeCount');
 function apply(){const q=search.value.trim().toLowerCase(),t=topic.value;let shown=0;cards.forEach(card=>{const okTopic=t==='all'||card.dataset.topic===t;const hay=(card.dataset.search+' '+card.textContent).toLowerCase();const okText=!q||hay.includes(q);card.hidden=!(okTopic&&okText);if(!card.hidden)shown++;});count.textContent=shown+' of '+cards.length+' guides';}
 search.addEventListener('input',apply);topic.addEventListener('change',apply);apply();
})();