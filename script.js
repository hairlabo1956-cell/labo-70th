/* ============================================================
   LABO 70th ANNIVERSARY ｜ script.js
   ⚠️ このファイルは「演出」だけを扱います（開幕アニメーション・慣性スクロール・HISTORYの横スクロール・
      年号カウンター・鏡・カウントダウン・祭の装飾）。文章や写真はここにはありません。
      編集は index.html で行ってください（このファイルは触らなくて大丈夫です）。
   ============================================================ */
(function(){
  'use strict';
  var doc=document, root=doc.documentElement;
  root.classList.add('js');
  /* OSの「動きを減らす」設定。この時はすべての演出を止め、最終状態を即座に出す（style.css と対） */
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- ⑤ 慣性スクロール（Lenis / CDN）。読み込めなかった時・動きを減らす設定の時は通常スクロール ---- */
  var lenis=null;
  if(window.Lenis && !reduced){
    try{
      lenis=new window.Lenis({lerp:0.09,smoothWheel:true});
      var rafLenis=function(t){lenis.raf(t);requestAnimationFrame(rafLenis);};
      requestAnimationFrame(rafLenis);
    }catch(e){lenis=null;}
  }

  /* ---- 日本語フォント（Shippori Mincho / Noto Sans JP）----
     ページ内で実際に使っている文字だけを含む形で Google Fonts に要求する（text= 指定）。
     通常の読み込みだと日本語の分割ファイルが約60個・1MB以上になり、届くたびにページ全体が組み直されてカクつくため。
     文字を書き足しても、ここで自動的に拾われる（index.html を直すだけでよい）。 */
  var jpFonts=Promise.resolve();
  (function(){
    var seen={},out='';
    function add(s){ Array.from(s||'').forEach(function(c){ if(c>' '&&!seen[c]){seen[c]=1;out+=c;} }); }
    add(doc.body.textContent);
    doc.querySelectorAll('[data-loop],[data-t]').forEach(function(el){ add(el.getAttribute('data-loop')); add(el.getAttribute('data-t')); });
    add('0123456789:.-—年月日時間分秒');
    var base='https://fonts.googleapis.com/css2?family=Shippori+Mincho&family=Noto+Sans+JP&display=swap';
    var link=doc.createElement('link'); link.rel='stylesheet'; link.href=base+'&text='+encodeURIComponent(out);
    jpFonts=new Promise(function(res){
      link.onload=res;
      link.onerror=function(){ var f=doc.createElement('link'); f.rel='stylesheet'; f.href=base; f.onload=res; f.onerror=res; doc.head.appendChild(f); };
      setTimeout(res,2500);
    });
    /* 最初の描画を待ってから要求する（先に要求すると、最初の描画がこのフォントを待つ形に評価されるため） */
    requestAnimationFrame(function(){ setTimeout(function(){ doc.head.appendChild(link); },0); });
  })();

  /* ---- ① ヒーロー開幕（トンボ→版の落下→見当合わせ→文字の着地→写真→年号→フッター） ---- */
  var hero=doc.getElementById('hero'),ci=0;
  if(hero){
    hero.querySelectorAll('.line').forEach(function(l){
      var txt=l.getAttribute('data-text')||l.textContent.trim();
      l.textContent='';
      var f=doc.createDocumentFragment();
      txt.split('').forEach(function(c){
        var s=doc.createElement('span');s.className='ch';s.style.setProperty('--i',ci++);s.textContent=c;f.appendChild(s);
      });
      l.appendChild(f);
    });
    var play=function(){hero.classList.remove('play');void hero.offsetWidth;hero.classList.add('play');};
    /* ヒーローで使う書体（Archivo と 明朝の1行）だけを待つ。ページ全体のフォント（日本語の分割ファイル約70個）を待つと遅いため。上限1.2秒 */
    if(doc.fonts&&doc.fonts.load){
      Promise.all([
        doc.fonts.load('800 1em Archivo','70TH ANNIVERSARY 1956-2026'),
        doc.fonts.load('600 1em Archivo','ANNIVERSARY PARTY 2026.10.31 sat'),
        jpFonts.then(function(){ return doc.fonts.load('400 1em "Shippori Mincho"','70年分のありがとうを。'); })
      ]).then(play,play);
      setTimeout(function(){if(!hero.classList.contains('play'))play();},1200);
    }else{play();}
  }

  /* ---- ⑥ 見出しのせり上がり（ヒーローの文字と同じ動き。この1種類だけ。汎用フェードは使わない） ---- */
  /* 注意：.h2 自身は clip-path で隠してあり、Chrome の IntersectionObserver は clip-path で隠れた要素を
     「画面に入っていない」と判定する（プロトタイプではこのため見出しが出なかった）。
     そこで、見出しの直前にあるラベル（.sub）を監視し、それが画面下から12%の位置まで入ったら見出しを出す。 */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target._h2.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:0,rootMargin:'0px 0px -12% 0px'});
    doc.querySelectorAll('.h2').forEach(function(el){
      var probe=el.previousElementSibling||el.parentElement; probe._h2=el; io.observe(probe);
    });
  } else { doc.querySelectorAll('.h2').forEach(function(el){el.classList.add('in');}); }

  /* ---- 祭の装飾を生成（提灯・紙吹雪） ---- */
  (function(){
    var l=doc.getElementById('lanterns');
    if(l){ var m=Math.max(5,Math.min(12,Math.round(window.innerWidth/150)));
      for(var j=0;j<m;j++){ var g=doc.createElement('span'); g.className='lantern';
        g.style.animationDelay=(j*0.24).toFixed(2)+'s'; l.appendChild(g); } }
    var c=doc.getElementById('confetti');
    if(c && !reduced){ for(var k=0;k<16;k++){ var d=doc.createElement('i');
        d.style.left=(Math.random()*100).toFixed(1)+'%';
        d.style.animation='fall '+(7+Math.random()*7).toFixed(1)+'s linear '+(Math.random()*8).toFixed(1)+'s infinite';
        d.style.opacity=(0.5+Math.random()*0.45).toFixed(2);
        c.appendChild(d); } }
  })();

  /* ---- 流れる帯（同じ文字列を2周分並べて途切れなく流す） ----
     帯の幅に必要な回数だけ文字列を並べる（プロトタイプの固定16回だと幅が3万px前後になり、
     iOS Safari では動いている最中に未描画の部分が画面に入って帯の一部が消える）。
     速さはプロトタイプと同じ「1フレーズ約9秒（黒い帯は8秒）」になるよう、回数から再生時間を決める。 */
  doc.querySelectorAll('.track').forEach(function(t){
    /* 区切り記号の「✳」(U+2733) は端末によって緑色の絵文字で描かれるため、絵文字扱いされない「✱」(U+2731) に置き換えて描く */
    var txt=(t.dataset.loop||t.textContent.trim()).replace(/✳︎?/g,'✱');
    var band=t.parentElement, perPhrase=(band&&band.classList.contains('b'))?8:9, lastW=0;
    function build(){
      var bw=band?band.getBoundingClientRect().width:window.innerWidth;
      if(Math.abs(bw-lastW)<40) return;          /* iOSのアドレスバー開閉などの高さ変化では組み直さない */
      lastW=bw;
      t.innerHTML='<span>'+txt+'</span>';
      var unit=t.firstChild.getBoundingClientRect().width||600;
      var need=Math.max(2,Math.ceil(bw/unit)+1), html='';
      for(var n=0;n<need;n++) html+='<span>'+txt+'</span>';
      t.innerHTML=html+html;                      /* 前半と後半を同じにして -50% で途切れなくループ */
      t.style.animationDuration=(need*perPhrase)+'s';
    }
    build();
    var rt=null;
    window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(build,200);});
    if(doc.fonts&&doc.fonts.ready) doc.fonts.ready.then(function(){lastW=0;build();});
  });

  /* ---- 漂うトンボ ---- */
  ['dust1','dust2'].forEach(function(id){
    var host=doc.getElementById(id); if(!host) return;
    for(var n=0;n<7;n++){
      var d=doc.createElement('i');
      d.style.left=(6+Math.random()*88)+'%';
      d.style.top=(6+Math.random()*88)+'%';
      d.style.animation='drift '+(4+Math.random()*4).toFixed(1)+'s ease-in-out '+(Math.random()*3).toFixed(1)+'s infinite alternate';
      d.style.opacity=(0.28+Math.random()*0.32).toFixed(2);
      host.appendChild(d);
    }
  });

  /* ---- 数字のカウントアップ（70 YEARS / 3 GENERATIONS / 5 STAFF） ---- */
  function countUp(el){
    var to=+el.dataset.count, t0=null, dur=1400;
    if(reduced){ el.textContent=to; return; }
    function step(ts){ if(!t0)t0=ts;
      var p=Math.min(1,(ts-t0)/dur), e=1-Math.pow(1-p,4);
      el.textContent=Math.round(to*e);
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var io2=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); io2.unobserve(e.target); } });
    },{threshold:.6});
    doc.querySelectorAll('[data-count]').forEach(function(el){io2.observe(el);});
    var io3=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io3.unobserve(e.target); } });
    },{threshold:.9});
    doc.querySelectorAll('.hl').forEach(function(el){io3.observe(el);});
  } else {
    doc.querySelectorAll('[data-count]').forEach(function(el){el.textContent=el.dataset.count;});
    doc.querySelectorAll('.hl').forEach(function(el){el.classList.add('in');});
  }

  /* ---- カウントダウン（目標時刻は index.html の <div class="cd" data-target="…"> に書いてある） ---- */
  var cdBox=doc.getElementById('cd');
  var TARGET=new Date((cdBox&&cdBox.getAttribute('data-target'))||'2026-10-31T11:00:00+09:00').getTime();
  var cdEls={d:doc.querySelector('[data-cd=d]'),h:doc.querySelector('[data-cd=h]'),
             m:doc.querySelector('[data-cd=m]'),s:doc.querySelector('[data-cd=s]')};
  var cdWrap=doc.querySelector('.cdwrap');
  function pad(n){return n<10?'0'+n:''+n;}
  function tick(){
    var left=Math.max(0,TARGET-Date.now()), sec=Math.floor(left/1000);
    if(cdEls.d) cdEls.d.textContent=Math.floor(sec/86400);
    if(cdEls.h) cdEls.h.textContent=pad(Math.floor(sec/3600)%24);
    if(cdEls.m) cdEls.m.textContent=pad(Math.floor(sec/60)%60);
    if(cdEls.s) cdEls.s.textContent=pad(sec%60);
    if(cdWrap) cdWrap.classList.toggle('done', left<=0);
  }
  tick(); setInterval(tick,1000);

  /* ---- ②③ HISTORY 横スクロール＋年号カウンター ----
     進行度の取得元は2系統：ピン留め表示（PC）は縦スクロール量から、横スワイプ表示（820px以下・動きを減らす設定）は横移動量から。 */
  var sec=doc.getElementById('history'),rail=doc.getElementById('rail'),
      wrap=doc.getElementById('stickywrap'),counter=doc.getElementById('counter'),
      bar=doc.getElementById('progress'),pp=doc.getElementById('pageprog'),dist=1,mobile=false;
  function measure(){
    if(!sec) return;
    mobile=window.matchMedia('(max-width:820px)').matches||reduced;
    if(mobile){sec.style.height='';rail.style.transform='';}
    else{dist=Math.max(1,rail.scrollWidth-window.innerWidth);sec.style.height=(window.innerHeight+dist)+'px';}
    update();
  }
  function prog(){
    if(mobile){var m=wrap.scrollWidth-wrap.clientWidth;return m>0?wrap.scrollLeft/m:0;}
    return Math.min(1,Math.max(0,-sec.getBoundingClientRect().top/dist));
  }
  function update(){
    /* 先に読む（位置・高さ）→ 後で書く（transform など）。読み書きを交互にするとレイアウトの再計算が毎フレーム走る */
    var p=sec?Math.min(1,Math.max(0,prog())):0, sy=window.scrollY, mx=root.scrollHeight-window.innerHeight;
    if(sec){
      if(!mobile) rail.style.transform='translate3d('+(-p*dist)+'px,0,0)';
      if(counter) counter.textContent=Math.round(1956+p*70);
      if(bar) bar.style.width=(p*100)+'%';
      if(p>0.02) sec.classList.add('moved');
    }
    doc.body.classList.toggle('scrolled', sy>window.innerHeight*0.6);
    if(pp) pp.style.width=(mx>0?(sy/mx*100):0)+'%';
  }
  var t=false;
  function onScroll(){if(!t){t=true;requestAnimationFrame(function(){update();t=false;});}}
  window.addEventListener('scroll',onScroll,{passive:true});
  if(wrap) wrap.addEventListener('scroll',onScroll,{passive:true});
  if(lenis) lenis.on('scroll',onScroll);           /* ⑤ Lenis のスクロール値と同期 */
  /* measure() はレイアウトを強制するので、連続して呼ばれる時（フォントの分割ファイルが次々届く時など）は150msにまとめる */
  var mt=null;
  function scheduleMeasure(){ clearTimeout(mt); mt=setTimeout(measure,150); }
  window.addEventListener('resize',scheduleMeasure);
  window.addEventListener('load',scheduleMeasure);
  if(doc.fonts&&doc.fonts.ready) doc.fonts.ready.then(scheduleMeasure);
  if(window.ResizeObserver && rail) new ResizeObserver(scheduleMeasure).observe(rail);
  if(sec && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){doc.body.classList.toggle('inhistory',e[0].isIntersecting);},{threshold:0}).observe(sec);
  }
  measure();

  /* ---- ④ 鏡：円の内側だけデュオトーンが解け、当時の色が戻る ----
     index.html の写真枠（.shot）には <img> が1枚あるだけ。ここで「紺の層」「元の写真の層」「手鏡の縁」を組み立てる。 */
  doc.querySelectorAll('.shot').forEach(function(shot){
    var img=shot.querySelector('img'); if(!img) return;
    shot.classList.add('has-img');
    var base=doc.createElement('div'); base.className='layer base';
    var raw=doc.createElement('div');  raw.className='layer raw';
    var rim=doc.createElement('div');  rim.className='rim'; rim.setAttribute('aria-hidden','true');
    var clone=img.cloneNode(true); clone.alt=''; clone.removeAttribute('fetchpriority');
    base.appendChild(img); raw.appendChild(clone);
    shot.appendChild(base); shot.appendChild(raw); shot.appendChild(rim);
    shot.classList.add('live');

    var R=70,tx=0,ty=0,cx=0,cy=0,on=false,raf=null;
    /* 鏡の大きさはパネル幅に連動（幅の21%＝直径42%）。縁(--r)も同じ値に揃える */
    function sizeR(){
      var w=shot.getBoundingClientRect().width,m=window.matchMedia('(max-width:820px)').matches;
      R=Math.max(m?36:44,Math.min(m?62:82,w*(m?0.23:0.21)));
      shot.style.setProperty('--r',R+'px');
    }
    sizeR(); window.addEventListener('resize',sizeR);
    function pos(e){var b=shot.getBoundingClientRect(),p=e.touches?e.touches[0]:e;tx=p.clientX-b.left;ty=p.clientY-b.top;}
    /* カーソルにわずかに遅れて追従（lerp 0.16）。ぴったり張り付かせると「ただのマスク」に見える */
    function loop(){cx+=(tx-cx)*.16;cy+=(ty-cy)*.16;
      raw.style.clipPath='circle('+R+'px at '+cx+'px '+cy+'px)';
      rim.style.transform='translate3d('+cx+'px,'+cy+'px,0)';raf=requestAnimationFrame(loop);}
    function start(e){pos(e);if(!on){cx=tx;cy=ty;on=true;shot.classList.add('active');loop();}}
    function end(){on=false;shot.classList.remove('active');cancelAnimationFrame(raf);
      raw.style.clipPath='circle(0px at '+cx+'px '+cy+'px)';}
    shot.addEventListener('mouseenter',start);
    shot.addEventListener('mousemove',function(e){pos(e);if(!on)start(e);});
    shot.addEventListener('mouseleave',end);
    shot.addEventListener('touchstart',function(e){start(e);},{passive:true});
    shot.addEventListener('touchmove',function(e){pos(e);},{passive:true});
    shot.addEventListener('touchend',end);
  });

  /* ---- CONTENTS の写真（任意）：.pic が入っている項目に印を付ける（:has() が使えないブラウザ向け） ---- */
  doc.querySelectorAll('.item').forEach(function(it){ if(it.querySelector('.pic')) it.classList.add('has-pic'); });

  /* ---- STAFF の写真枠：<img> が入っていれば紺のデュオトーン表示に切り替える ---- */
  doc.querySelectorAll('.sp').forEach(function(sp){
    var img=sp.querySelector('img'); if(!img) return;
    sp.classList.add('has-img');
    if(!img.parentElement.classList.contains('tone')){ var t=doc.createElement('div'); t.className='tone'; img.parentNode.insertBefore(t,img); t.appendChild(img); }
  });

  /* ---- ① 風（ドライヤー）：スクロールの速さ→風の強さ。提灯・紙吹雪・トンボ・のぼり・スタンプが風向きに流れ、止まると収まる ----
     rotate / translate（transform とは別に合成される個別プロパティ）に書くので、既存の揺れのアニメーションと共存する */
  if(!reduced){
    var lanterns=[],confetti=[],dust=[],nobori=doc.querySelector('.nobori'),stamp=doc.querySelector('.stamp');
    var collect=function(){
      lanterns=[].slice.call(doc.querySelectorAll('.lantern')).map(function(el,i){return {el:el,k:0.8+((i*7)%5)/10};});
      confetti=[].slice.call(doc.querySelectorAll('.confetti i')).map(function(el,i){return {el:el,k:0.6+((i*13)%9)/10};});
      dust=[].slice.call(doc.querySelectorAll('.dust i')).map(function(el,i){return {el:el,k:0.5+((i*5)%6)/10};});
    };
    collect();
    var windLastY=window.scrollY, wind=0, windShown=0;
    var windFrame=function(){
      var y=window.scrollY, v=y-windLastY; windLastY=y;
      var target=Math.max(-1,Math.min(1,v/28));          /* 1フレームに28px以上の速さで最大風力 */
      wind+=(target-wind)*(Math.abs(target)>Math.abs(wind)?0.25:0.05);   /* 吹き始めは速く、収まりはゆっくり */
      if(Math.abs(wind)<0.002) wind=0;
      if(wind!==windShown){
        windShown=wind; var i;
        for(i=0;i<lanterns.length;i++) lanterns[i].el.style.rotate=(-wind*26*lanterns[i].k)+'deg';
        for(i=0;i<confetti.length;i++) confetti[i].el.style.translate=(wind*170*confetti[i].k)+'px 0';
        for(i=0;i<dust.length;i++) dust[i].el.style.translate=(wind*60*dust[i].k)+'px 0';
        if(nobori) nobori.style.rotate=(-wind*14)+'deg';
        if(stamp) stamp.style.rotate=(-wind*6)+'deg';
      }
      requestAnimationFrame(windFrame);
    };
    requestAnimationFrame(windFrame);
  }

  /* ---- ③ 梳く（コーム）：写真が画面に入る時、コームの歯が通り過ぎながら現れる ----
     写真枠の上に覆い（.comb）を重ね、枠が画面に入ったら右へ抜けさせる */
  if(!reduced){
    var combHosts=[].slice.call(doc.querySelectorAll('.shot.live, .sp.has-img, .item .pic, .shop .sphoto, .rshot'));
    combHosts.forEach(function(t){ var c=doc.createElement('i'); c.className='comb'; c.setAttribute('aria-hidden','true'); t.appendChild(c); });
    if('IntersectionObserver' in window){
      var ioComb=new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ var c=e.target.querySelector(':scope > .comb'); if(c) c.classList.add('in'); ioComb.unobserve(e.target); } });
      },{threshold:.35});
      combHosts.forEach(function(t){ ioComb.observe(t); });
    } else { combHosts.forEach(function(t){ var c=t.querySelector(':scope > .comb'); if(c) c.classList.add('in'); }); }
  }

  /* ---- 固定ボタン「開催概要を見る」 ---- */
  var jump=doc.querySelector('.jump');
  if(jump) jump.addEventListener('click',function(e){
    e.preventDefault();
    var target=doc.getElementById('event'); if(!target) return;
    if(lenis) lenis.scrollTo(target,{duration:1.4});
    else target.scrollIntoView({behavior:reduced?'auto':'smooth'});
  });

  /* ---- URL未設定（href="#"）のリンクは、押してもページ先頭へ飛ばないようにしておく ---- */
  doc.querySelectorAll('a[href="#"]').forEach(function(a){ a.addEventListener('click',function(e){e.preventDefault();}); });
})();
