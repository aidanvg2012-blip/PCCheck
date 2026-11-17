'use strict';
const byId = (id) => document.getElementById(id);
const number = (id) => Number(byId(id).value);
const showResult = (id, html) => { const el = byId(id); el.innerHTML = html; el.hidden = false; el.scrollIntoView({behavior:'smooth',block:'nearest'}); };
const item = (title, body) => '<div class="lab-plan-item"><div><b>'+title+'</b><p>'+body+'</p></div></div>';

byId('makeUpgradePlan').addEventListener('click', () => {
  const use = byId('useCase').value, pain = byId('painPoint').value, ram = byId('ramAmount').value, drive = byId('driveType').value, budget = byId('upgradeBudget').value;
  const plan = [];
  const budgetText = {low:'Keep the first step low-cost and verify the cause before replacing major parts.',mid:'Compare one targeted upgrade with the cost of a larger platform change.',high:'Prioritize the component tied to the problem, then reserve money for compatibility.',premium:'Compare the total platform cost, not just the headline component.' ,none:'Use monitoring and research first; there is no need to buy anything yet.'}[budget];
  if(pain==='fps'){
    plan.push(['Check what is limiting frame rate','Measure CPU and GPU usage in the games you actually play, at your normal resolution and settings. High GPU usage often points toward graphics settings or GPU limits; a CPU limit can look different.']);
    plan.push(['Review the graphics card and power setup','If the GPU is consistently fully utilized, compare a graphics upgrade against your budget. Confirm PSU model, connectors, case clearance, and current market prices first.']);
    if(use==='gaming' && ram==='8') plan.push(['Check memory capacity','8 GB can be restrictive in modern games. Verify the system supports a compatible 16 GB or 32 GB configuration and check whether memory is running in dual-channel.']);
  } else if(pain==='stutter'){
    plan.push(['Check memory pressure','Watch RAM use while the problem happens. If memory is nearly full, close background apps and investigate a compatible capacity upgrade.']);
    plan.push(['Check temperatures and storage health','Look for thermal throttling, drive health warnings, and background tasks before assuming the CPU or GPU needs replacing.']);
    plan.push(['Test one change at a time','Update drivers from the hardware maker, check game files, and retest the same scene so you can identify what helped.']);
  } else if(pain==='loading'){
    plan.push(['Identify the drive used by the slow app','If the operating system or games are on an HDD, moving them to an SSD can improve loading responsiveness.']);
    plan.push(['Check available space and drive health','Keep free space available and review drive health before buying a replacement.']);
    if(drive==='nvme') plan.push(['Check the actual bottleneck','If you already use an NVMe SSD, slow loading may be caused by the app, network, CPU, or drive condition rather than needing a faster SSD.']);
  } else if(pain==='storage'){
    plan.push(['Measure what is taking space','Review game libraries, video files, and downloads. Decide which files need fast SSD storage and which can live on a larger secondary drive.']);
    plan.push(['Choose capacity with room to grow','Use the storage planner below and leave free space for updates and temporary files.']);
    plan.push(['Check the connection and physical fit','Confirm M.2 slot support, SATA connections, drive dimensions, and motherboard lane-sharing notes.']);
  } else if(pain==='heat'){
    plan.push(['Measure temperatures under a repeatable workload','Use a trusted hardware monitor and compare readings with the CPU/GPU manufacturer limits.']);
    plan.push(['Inspect airflow and cooling','Check dust filters, fan operation, cooler mounting, and case airflow. Clean only with the PC powered off and follow manufacturer guidance.']);
    plan.push(['Do not buy parts until the cause is known','High temperatures can come from airflow, fan curves, mounting, or software load—not only an undersized cooler.']);
  } else {
    plan.push(['Record a baseline','Note your CPU, GPU, RAM, storage, temperatures, and what feels slow. Reproduce the issue before changing anything.']);
    plan.push(['Use the symptom to narrow the upgrade','Frame-rate limits, stutters, slow loading, storage shortage, and heat have different causes.']);
    plan.push(['Check compatibility before shopping','Use the PCCheck build checker to verify sockets, memory generation, dimensions, and power details.']);
  }
  if((use==='creator'||use==='multitasking') && Number(ram)<32) plan.push(['Consider memory capacity for heavier workloads','For editing, streaming, and multitasking, 32 GB can provide more breathing room than 8–16 GB, depending on the apps and projects. Check motherboard limits and memory compatibility.']);
  if(drive==='hdd' && pain!=='loading' && pain!=='storage') plan.push(['Review your system drive','If Windows and frequently used apps are on an HDD, an SSD can make everyday use feel more responsive.']);
  plan.push(['Set a realistic spending limit',budgetText]);
  showResult('upgradeResult','<div class="lab-result-head"><span>YOUR PERSONALIZED ROADMAP</span><strong>'+plan.length+' steps</strong></div><div class="lab-plan-list">'+plan.map(x=>item(x[0],x[1])).join('')+'</div><p class="lab-result-note">This is a troubleshooting order, not a diagnosis or a promise that one upgrade will improve performance. Verify exact models and compare current prices before purchasing.</p>');
});

byId('estimatePsu').addEventListener('click', () => {
  const cpu=number('cpuWatts'), gpu=number('gpuWatts'), other=number('otherWatts'), headroom=number('powerHeadroom');
  if(![cpu,gpu,other].every(v=>Number.isFinite(v)&&v>0&&v<=1200)){showResult('psuResult','<p>Enter valid positive wattage estimates for all three fields.</p>');return;}
  const base=cpu+gpu+other, target=Math.ceil(base*(1+headroom/100)), tiers=[450,550,650,750,850,1000,1200,1500,1600], recommended=tiers.find(v=>v>=target)||Math.ceil(target/100)*100;
  showResult('psuResult','<div class="lab-result-head"><span>ESTIMATED CAPACITY TARGET</span><strong>'+recommended.toLocaleString()+' W</strong></div><div class="lab-plan-list">'+item('Estimated system draw',base.toLocaleString()+' W before planning headroom.')+item('Planning headroom',headroom+'% added, giving a calculated target of about '+Math.ceil(target).toLocaleString()+' W.')+item('What to verify next','Check the exact GPU manufacturer recommendation, PSU quality and model, native connectors, transient power behavior, and case fit.')+'</div><p class="lab-result-note">This is a rough sizing estimate, not a PSU quality rating. A high-wattage low-quality unit is not a safe substitute for a reputable model. Follow the GPU and PSU manufacturers’ requirements.</p>');
});

byId('estimateStorage').addEventListener('click', () => {
  const used=number('usedStorage'), planned=number('plannedStorage'), reserve=number('freeSpace');
  if(![used,planned].every(v=>Number.isFinite(v)&&v>=0&&v<=100000)){showResult('storageResult','<p>Enter valid storage amounts between 0 and 100,000 GB.</p>');return;}
  const needed=(used+planned)/(1-reserve/100), tiers=[500,1000,2000,4000,8000,16000], recommended=tiers.find(v=>v>=needed)||Math.ceil(needed/1000)*1000, formatted=recommended>=1000?(recommended/1000)+' TB':recommended+' GB';
  showResult('storageResult','<div class="lab-result-head"><span>PLANNING CAPACITY</span><strong>'+formatted+'</strong></div><div class="lab-plan-list">'+item('Current plus planned data',Math.round(used+planned).toLocaleString()+' GB.')+item('Free-space reserve',reserve+'% kept available for updates, temporary files, and normal use.')+item('Before choosing a drive','Check the motherboard slot, SATA support, M.2 size, interface, and whether installing a drive disables another port.')+'</div><p class="lab-result-note">Drive manufacturers use decimal capacity, so the usable capacity shown by an operating system will be lower than the label. This estimate is for planning, not a purchase requirement.</p>');
});
