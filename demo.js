/* ============================================================
   demo.js ｜ 動きの試作（本番には読み込まれない）
   ① 風：スクロールの速さ→風の強さ。旗・提灯・紙吹雪・トンボ・スタンプが風向きに流れ、止まると収まる
   ② 切る：年号カウンターと秒の数字が、切り分かれて入れ替わる
   ③ 梳く：写真が画面に入る時、コームの歯が通り過ぎながら現れる
   ④ 髪：紙吹雪を切った髪の断片に（CSSのみ）
   ============================================================ */
(function(){
  'use strict';
  var doc=document, root=doc.documentElement;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ['fx-wind','fx-snip','fx-comb','fx-hair'].forEach(function(c){root.classList.add(c);});
  if(reduced) return;

  /* ---- 切替パネル ---- */
  var panel=doc.getElementById('fxpanel');
  if(panel){
    panel.querySelectorAll('input[data-fx]').forEach(function(cb){
      cb.addEventListener('change',function(){ root.classList.toggle('fx-'+cb.dataset.fx, cb.checked); });
    });
  }

  /* ================= ① 風 ================= */
  var lanterns=[], confetti=[], dust=[], nobori=doc.querySelector('.nobori'), stamp=doc.querySelector('.stamp');
  function collect(){
    lanterns=[].slice.call(doc.querySelectorAll('.lantern')).map(function(el,i){return {el:el,k:0.8+((i*7)%5)/10};});
    confetti=[].slice.call(doc.querySelectorAll('.confetti i')).map(function(el,i){return {el:el,k:0.6+((i*13)%9)/10};});
    dust=[].slice.call(doc.querySelectorAll('.dust i')).map(function(el,i){return {el:el,k:0.5+((i*5)%6)/10};});
  }
  collect(); setTimeout(collect,600);
  var lastY=window.scrollY, wind=0, shown=0;
  function frame(){
    var y=window.scrollY, v=y-lastY; lastY=y;
    var target=Math.max(-1,Math.min(1,v/28));          /* 1フレームに28px以上で最大風力 */
    var k=Math.abs(target)>Math.abs(wind)?0.25:0.05;    /* 吹き始めは速く、止まるとゆっくり収まる */
    wind+=(target-wind)*k;
    if(Math.abs(wind)<0.002) wind=0;
    var on=root.classList.contains('fx-wind');
    var w=on?wind:0;
    if(w!==shown){
      shown=w;
      var i;
      for(i=0;i<lanterns.length;i++) lanterns[i].el.style.rotate=(-w*26*lanterns[i].k)+'deg';
      for(i=0;i<confetti.length;i++) confetti[i].el.style.translate=(w*170*confetti[i].k)+'px 0';
      for(i=0;i<dust.length;i++) dust[i].el.style.translate=(w*60*dust[i].k)+'px 0';
      if(nobori) nobori.style.rotate=(-w*14)+'deg';
      if(stamp) stamp.style.rotate=(-w*6)+'deg';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ================= ③ 梳く ================= */
  var targets=doc.querySelectorAll('.shot.live, .sp.has-img, .item .pic, .shop .sphoto, .rshot');
  var combs=[];
  targets.forEach(function(t){
    var c=doc.createElement('i'); c.className='comb'; c.setAttribute('aria-hidden','true');
    t.appendChild(c); combs.push(c);
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.35});
    combs.forEach(function(c){ io.observe(c.parentElement); });
    /* 親が見えたら覆いに in を付ける（覆い自身は clip 等で交差判定が不安定なため親を監視） */
    var io2=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ var c=e.target.querySelector(':scope > .comb'); if(c) c.classList.add('in'); io2.unobserve(e.target); } });
    },{threshold:.35});
    combs.forEach(function(c){ io2.observe(c.parentElement); });
  } else { combs.forEach(function(c){ c.classList.add('in'); }); }

  /* ================= ② 切る ================= */
  /* 元の要素は本番の script.js が textContent を書き換えるので、上に「鏡」を重ねて鏡側で演出する */
  function makeSnip(orig, vertical){
    var wrap=doc.createElement('span'); wrap.className='snipwrap';
    orig.parentNode.insertBefore(wrap,orig); wrap.appendChild(orig); orig.classList.add('orig');
    var mirror=orig.cloneNode(false); mirror.className=(orig.className||'').replace('orig','')+' mirror'; mirror.removeAttribute('id'); mirror.removeAttribute('data-cd');
    var v=doc.createElement('span'); v.className='v'; v.textContent=orig.textContent; mirror.appendChild(v);
    var a=doc.createElement('span'); a.className='snip a'; var b=doc.createElement('span'); b.className='snip b';
    mirror.appendChild(a); mirror.appendChild(b); wrap.appendChild(mirror);
    var last=orig.textContent, lastT=0;
    new MutationObserver(function(){
      var now=orig.textContent; if(now===last) return;
      var t=performance.now();
      v.textContent=now;
      if(root.classList.contains('fx-snip') && t-lastT>140){
        lastT=t; a.textContent=last; b.textContent=last;
        a.classList.remove('on'); b.classList.remove('on'); void a.offsetWidth;
        a.classList.add('on'); b.classList.add('on');
      }
      last=now;
    }).observe(orig,{childList:true,characterData:true,subtree:true});
    return mirror;
  }
  var sec=doc.querySelector('[data-cd=s]'); if(sec) makeSnip(sec,false);
  var counter=doc.getElementById('counter');
  if(counter){
    /* 縦書きの固定要素：同じ見た目の鏡を別に作って重ねる */
    var m=doc.createElement('div'); m.className='counter mirror-host'; m.setAttribute('aria-hidden','true');
    var v=doc.createElement('span'); v.className='v'; v.textContent=counter.textContent; m.appendChild(v);
    var a=doc.createElement('span'); a.className='snip a'; var b=doc.createElement('span'); b.className='snip b'; m.appendChild(a); m.appendChild(b);
    counter.parentNode.insertBefore(m,counter.nextSibling); counter.style.visibility='hidden';
    var last=counter.textContent, lastT=0;
    new MutationObserver(function(){
      var now=counter.textContent; if(now===last) return; var t=performance.now();
      v.textContent=now;
      if(root.classList.contains('fx-snip') && t-lastT>140){
        lastT=t; a.textContent=last; b.textContent=last;
        a.classList.remove('on'); b.classList.remove('on'); void a.offsetWidth; a.classList.add('on'); b.classList.add('on');
      }
      last=now;
    }).observe(counter,{childList:true,characterData:true,subtree:true});
  }
})();
