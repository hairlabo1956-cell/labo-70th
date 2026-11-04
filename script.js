/* LABO 70th — デザイン案「MOTION」の動き */
(function(){
  var doc=document, body=doc.body, reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vh=window.innerHeight, vw=window.innerWidth;
  /* 指でスクロールする画面（スマホ・タブレット）。iPhone のスクロールは JavaScript とは別に動くので、
     スクロールに合わせて要素の縦の位置を JavaScript で動かすと1コマ遅れて前後に揺れて見える。こういう画面ではその動きを使わない */
  var touch=window.matchMedia('(hover: none)').matches;
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  /* =========================================================
     最初の演出：一筆書きの「70」→ ハサミで切るように上下に開く
     ・線は約2.3秒で描き切る。写真の読み込みが終わっていなければ、描き終えた状態で待つ（最長4.5秒）
     ・スマホ（縦長）は「70」の周りだけを表示範囲にして大きく見せる
     ========================================================= */
  var loader=doc.getElementById('loader');
  function ready(){ body.classList.add('ready'); setTimeout(function(){ doc.getElementById('heroCards').classList.add('live'); heroLive=true; dirty=true; },1900); }
  var heroLive=false, dirty=true;
  var LD_PATH='M -60 650 C 160 660, 300 560, 400 440 C 460 360, 480 300, 525 300 L 755 300 C 700 400, 640 520, 605 640 C 598 690, 700 702, 800 662 C 860 642, 900 642, 940 642 C 1018 642, 1075 565, 1075 470 C 1075 375, 1018 298, 940 298 C 865 298, 805 370, 805 470 C 805 565, 862 646, 940 646 C 1030 650, 1120 670, 1260 640 S 1520 590, 1680 610';
  /* 縦長の画面（スマホ・タブレット縦）用：線の始まりと終わりも画面の内側に収める短い線。表示範囲は線の大きさから毎回計算する */
  var LD_PATH_SP='M 525 300 L 755 300 C 700 400, 640 520, 605 640 C 598 690, 700 702, 800 662 C 860 642, 900 642, 940 642 C 1018 642, 1075 565, 1075 470 C 1075 375, 1018 298, 940 298 C 865 298, 805 370, 805 470 C 805 565, 862 646, 940 646 C 1010 650, 1070 658, 1125 650';
  var ldPlaying=false;
  function opening(first){
    if(ldPlaying) return; ldPlaying=true;
    var full=loader.querySelector('.ld-full path'), halves=loader.querySelectorAll('.ld-half path'), tip=loader.querySelector('.ld-tip');
    var ldSP=window.innerHeight>window.innerWidth, d=ldSP?LD_PATH_SP:LD_PATH;
    /* 前回の状態を一瞬で戻す（幕が閉じる動きを見せない） */
    loader.className='loader reset'; void loader.offsetWidth; loader.classList.remove('reset');
    body.classList.add('lock');
    [full].concat([].slice.call(halves)).forEach(function(p){ p.setAttribute('d',d); });
    var ldVB='0 0 1600 900';
    if(ldSP){ var bb=full.getBBox(), px=bb.width*.1, py=bb.height*.18; ldVB=[bb.x-px,bb.y-py,bb.width+px*2,bb.height+py*2].map(function(v){ return Math.round(v); }).join(' '); }
    loader.querySelectorAll('svg').forEach(function(sv){ sv.setAttribute('viewBox',ldVB); });
    var L=full.getTotalLength();
    full.style.strokeDasharray=L+' '+(L+10); full.style.strokeDashoffset=L;
    halves.forEach(function(p){ p.style.strokeDasharray='none'; p.style.strokeDashoffset=0; });
    var left=0;
    if(first){ [].slice.call(doc.images).filter(function(i){ return !i.loading||i.loading!=='lazy'; }).forEach(function(i){ if(!i.complete){ left++; var f=function(){ left--; }; i.addEventListener('load',f,{once:true}); i.addEventListener('error',f,{once:true}); } }); }
    var t0=performance.now(), DRAW=2300, MAX=4500, cutAt=0;
    var ease=function(t){ return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; };
    (function step(t){
      var el=t-t0, p=clamp(el/DRAW,0,1), len=L*ease(p), pt=full.getPointAtLength(len);
      full.style.strokeDashoffset=L-len;
      tip.setAttribute('cx',pt.x); tip.setAttribute('cy',pt.y); tip.style.opacity=p<1?1:0;
      if(el>1900) loader.classList.add('cap-on');
      if(p>=1&&!cutAt&&(left<=0||el>MAX)&&el>2500){
        cutAt=el; loader.classList.add('cut-on');
        setTimeout(function(){ loader.classList.add('split','done'); body.classList.remove('lock'); ready(); setTimeout(function(){ loader.classList.add('gone'); ldPlaying=false; },1100); },500);
      }
      if(!cutAt) requestAnimationFrame(step);
    })(t0);
  }
  var fromPhotos=/\/photos(\.html)?([?#]|$)/.test(doc.referrer);  /* 写真ページから戻った時は最初の演出を繰り返さない */
  if(reduced||fromPhotos){ loader.classList.add('gone'); ready(); }
  else opening(true);

  /* =========================================================
     メニュー
     ========================================================= */
  var menuBtn=doc.getElementById('menuBtn');
  function setMenu(o){ body.classList.toggle('menu-open',o); menuBtn.setAttribute('aria-expanded',o?'true':'false'); }
  menuBtn.addEventListener('click',function(){ setMenu(!body.classList.contains('menu-open')); });
  doc.addEventListener('keydown',function(e){ if(e.key==='Escape') setMenu(false); });
  doc.querySelectorAll('.menu a').forEach(function(a){ a.addEventListener('click',function(){ setMenu(false); }); });

  /* =========================================================
     文字シャッフル（ラベル）
     ========================================================= */
  var CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*';
  function scramble(el){
    var fin=el.getAttribute('data-final')||el.textContent; el.setAttribute('data-final',fin);
    if(reduced){ el.textContent=fin; return; }
    var t0=performance.now(), dur=900+fin.length*18;
    (function step(t){
      var p=clamp((t-t0)/dur,0,1), n=Math.floor(p*fin.length), s='';
      for(var i=0;i<fin.length;i++){ var c=fin[i]; s+= (i<n||c===' ')?c:CH[(Math.random()*CH.length)|0]; }
      el.textContent=s; if(p<1) requestAnimationFrame(step); else el.textContent=fin;
    })(t0);
  }

  /* =========================================================
     読むと濃くなる本文（1文字ずつ span に）
     ========================================================= */
  /* 絵文字（🙇‍♂️ など複数の文字でできているもの）を分解しないように、見た目の1文字ずつに分ける */
  function graphemes(s){ return window.Intl&&Intl.Segmenter?Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(s),function(x){ return x.segment; }):Array.from(s); }
  var read=doc.getElementById('read'), chars=[], marks=[];
  (function wrap(node){
    [].slice.call(node.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var f=doc.createDocumentFragment();
        graphemes(c.textContent).forEach(function(ch){ var s=doc.createElement('span'); s.className='ch'; s.textContent=ch; chars.push(s); f.appendChild(s); });
        node.replaceChild(f,c);
      } else if(c.nodeType===1) wrap(c);
    });
  })(read);
  read.querySelectorAll('p.mark').forEach(function(p){ var cs=p.querySelectorAll('.ch'); marks.push({p:p,last:chars.indexOf(cs[cs.length-1])}); });
  var litCount=0;

  /* =========================================================
     出てくる動き（IntersectionObserver）
     ========================================================= */
  doc.querySelectorAll('.st-card,.hs-lead,.w-lead').forEach(function(el,i){ el.classList.add('rise'); });
  if('IntersectionObserver' in window&&!reduced){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return; var t=e.target; io.unobserve(t);
        if(t.hasAttribute('data-scramble')) scramble(t);
        else t.classList.add('in');
      });
    },{rootMargin:'0px 0px -10% 0px'});
    doc.querySelectorAll('.rise,[data-scramble]').forEach(function(t){ io.observe(t); });
    /* 並んだカードは少しずつずらす */
    doc.querySelectorAll('.st-list').forEach(function(g){ [].forEach.call(g.children,function(c,i){ c.style.transitionDelay=(i%3)*.08+'s'; }); });
  } else { doc.querySelectorAll('.rise').forEach(function(t){ t.classList.add('in'); }); chars.forEach(function(c){ c.classList.add('on'); }); }

  /* =========================================================
     曲面ギャラリー（canvas に縦の短冊で描いて、端ほど高く＝曲面に見せる）
     ========================================================= */
  function Curve(canvas,entries,opt){
    var ctx=canvas.getContext('2d'), W=0,H=0,dpr=1,cw=0,ch=0,gap=0, offs=[], self={offset:0,cur:0};
    function cover(img,w,h){
      var c=doc.createElement('canvas'); c.width=w; c.height=h; var x=c.getContext('2d');
      var s=Math.max(w/img.naturalWidth,h/img.naturalHeight), sw=w/s, sh=h/s;
      var pos=(img.getAttribute('data-pos')||'50% 50%').split(' '), px=parseFloat(pos[0])/100, py=parseFloat(pos[1])/100;
      x.drawImage(img,(img.naturalWidth-sw)*px,(img.naturalHeight-sh)*py,sw,sh,0,0,w,h); return c;
    }
    self.size=function(){
      var r=canvas.getBoundingClientRect(); W=r.width; H=r.height; dpr=Math.min(2,window.devicePixelRatio||1);
      canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      cw=opt.cw(W,H); ch=cw*opt.ratio; gap=cw*opt.gap;
      var made=new Map();  /* 同じ写真は1枚だけ作って使い回す（フッターの帯は同じ写真を4周分並べている） */
      offs=entries.map(function(e){ if(!e.img) return null; if(!made.has(e.img)) made.set(e.img,cover(e.img,Math.round(cw*dpr),Math.round(ch*dpr))); return made.get(e.img); });
      self.step=cw+gap; self.travel=(entries.length-1)*self.step;
    };
    self.draw=function(){
      ctx.clearRect(0,0,W,H);
      var cy=H*opt.cy, k=opt.bend, sw=Math.max(touch?4:3,Math.round(W/320));
      for(var j=0;j<entries.length;j++){
        var o=offs[j]; if(!o) continue;
        var left=W/2+j*self.step-self.cur-cw/2;
        if(left>W||left+cw<0) continue;
        for(var s=0;s<cw;s+=sw){
          var x=left+s; if(x+sw<0||x>W) continue;
          var t=(x+sw/2-W/2)/(W/2), sy=1+k*t*t, h=ch*sy, w=Math.min(sw,cw-s);
          ctx.drawImage(o,s*dpr,0,w*dpr,o.height,x,cy-h/2,w+.7,h);
        }
      }
    };
    return self;
  }
  function loadImg(src){ return new Promise(function(res){ var i=new Image(); i.onload=function(){ res(i); }; i.onerror=function(){ res(null); }; i.src=src; }); }

  var wPin=doc.getElementById('wPin'), wSticky=wPin.querySelector('.w-sticky'), wCanvas=doc.getElementById('wCanvas'), wTitle=doc.getElementById('wTitle'), wIn=wTitle.querySelector('.wt-in');
  var wPill=doc.getElementById('wPill'), wNo=doc.getElementById('wNo'), wTicks=doc.getElementById('wTicks'), wGo=doc.getElementById('wGo');
  var items=[].map.call(doc.querySelectorAll('#wData li'),function(li){ return {title:li.getAttribute('data-title'),pill:li.getAttribute('data-pill'),color:li.getAttribute('data-color'),imgs:li.getAttribute('data-imgs').split('|'),link:li.getAttribute('data-link')}; });
  var gallery=null, gEntries=[], activeItem=-1, G_GAP=.14;
  var gN=items.reduce(function(a,it){ return a+it.imgs.length; },0);
  function gCw(W){ return W<700?W*.66:Math.min(W*.3,520); }
  function setItem(n,instant){
    if(n===activeItem) return; activeItem=n; var it=items[n];
    var apply=function(){ wIn.innerHTML=it.title; wTitle.style.setProperty('--wc',it.color); wPill.textContent=it.pill; wGo.href=it.link; wNo.textContent=(n<9?'0':'')+(n+1); };
    if(instant||reduced){ apply(); return; }
    wTitle.classList.add('out');
    setTimeout(function(){ apply(); wTitle.classList.remove('out'); wTitle.classList.add('pre'); void wIn.offsetWidth; wTitle.classList.remove('pre'); },260);
  }
  setItem(0,true);
  (function(){
    var jobs=[];
    items.forEach(function(it,n){ it.imgs.forEach(function(src){ jobs.push(loadImg(src).then(function(i){ return {item:n,img:i}; })); }); });
    return Promise.all(jobs);
  })().then(function(list){
    gEntries=list.filter(function(e){ return e.img; });
    gallery=Curve(wCanvas,gEntries,{cw:gCw,ratio:.68,gap:G_GAP,cy:.56,bend:.34});
    layout(true);
  });

  /* フッターの曲面の帯（写真は canvas の data-imgs） */
  var ftCanvas=doc.getElementById('ftStrip'), strip=null, stripN=0;
  Promise.all(ftCanvas.getAttribute('data-imgs').split('|').map(loadImg)).then(function(l){
    l=l.filter(Boolean); stripN=l.length;
    var ents=[]; for(var r=0;r<4;r++) l.forEach(function(i){ ents.push({img:i}); });
    strip=Curve(ftCanvas,ents,{cw:function(W,H){ return H*1.25; },ratio:.68,gap:.04,cy:.5,bend:.28});
    strip.size(); strip.cur=strip.offset=strip.step*stripN;
  });

  /* =========================================================
     レイアウト（ピン留めの長さ）とスクロールに合わせた動き
     ========================================================= */
  var heroCards=[].slice.call(doc.querySelectorAll('.hc')), heroWrap=doc.querySelector('.hero-type-wrap'), blTrack=doc.getElementById('blTrack');
  var concept=doc.getElementById('message');
  /* 1956 → 2026 の回転式カウンター */
  var odoPin=doc.getElementById('odoPin'), odoSticky=odoPin.querySelector('.odo-sticky'), odoBar=doc.getElementById('odoBar').parentNode, odoJp=doc.getElementById('odoJp'), lastYear=-1;
  var cols=[].map.call(doc.querySelectorAll('#odo .dg'),function(d){ var c=doc.createElement('span'); c.className='dg-col'; for(var n=0;n<10;n++){ var s=doc.createElement('span'); s.textContent=n; c.appendChild(s); } d.appendChild(c); return c; });
  function setYear(y){ if(y===lastYear) return; lastYear=y; String(y).split('').forEach(function(ch,i){ cols[i].style.transform='translateY('+(-ch*10)+'%)'; }); }
  setYear(1956);
  odoPin.style.setProperty('--oh',odoSticky.offsetHeight+'px');
  /* 年表のシート：入ってきたら中身が出る・いま見ているタブを太字に */
  var sheets=[].slice.call(doc.querySelectorAll('.hs')), tabs=sheets.map(function(s){ return s.querySelector('.hs-tab'); }), hsStack=doc.querySelector('.hs-stack');
  /* 年表の写真を「文章を置いた残りの場所」いっぱいの大きさにする（縦横比はそのまま。スマホで文章が画面の外に出ないように） */
  function px(v){ return parseFloat(v)||0; }
  function fitHS(){
    if(!sheets) return;
    sheets.forEach(function(s){
      var inn=s.querySelector('.hs-in'), tx=s.querySelector('.hs-tx'), cs=getComputedStyle(inn);
      var cols=cs.gridTemplateColumns.split(' ').filter(Boolean), one=cols.length<2;
      var inH=inn.clientHeight-px(cs.paddingTop)-px(cs.paddingBottom), inW=inn.clientWidth-px(cs.paddingLeft)-px(cs.paddingRight);
      var aH=(one?inH-tx.offsetHeight-px(cs.rowGap):inH)-14, aW=(one?inW:px(cols[0]))*.9;  /* 写真は傾けて置くので、角がはみ出さないよう少し狭く */
      var pair=s.querySelector('.hs-pair');
      if(pair){
        var im=pair.querySelector('.a img'), fs=getComputedStyle(im.parentNode), fv=px(fs.paddingTop)+px(fs.paddingBottom), fh=px(fs.paddingLeft)+px(fs.paddingRight), ar=(+im.getAttribute('width'))/(+im.getAttribute('height'));
        var w=(aH-fv+fh/ar)/(.64/ar+.3); var pw=Math.round(Math.max(120,Math.min(aW,w,720))); pair.style.width=pw+'px'; pair.style.paddingBottom=Math.round(pw*.3)+'px';  /* % の padding は親の幅基準になるので px で */
      } else {
        var img=s.querySelector('.hs-photo img'); if(!img) return;
        var f=getComputedStyle(img.parentNode), fv2=px(f.paddingTop)+px(f.paddingBottom), fh2=px(f.paddingLeft)+px(f.paddingRight), ar2=(+img.getAttribute('width'))/(+img.getAttribute('height'));
        var hh=Math.max(90,Math.min(aH-fv2,(aW-fh2)/ar2,680));
        img.style.height=Math.round(hh)+'px'; img.style.width=Math.round(hh*ar2)+'px';
      }
      s.classList.add('fit');
    });
  }
  fitHS();
  if('IntersectionObserver' in window&&!reduced){ var hio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); hio.unobserve(e.target); } }); },{threshold:.3}); sheets.forEach(function(s){ hio.observe(s); }); }
  else sheets.forEach(function(s){ s.classList.add('in'); });
  var stStage=doc.getElementById('stStage'), sps=[].slice.call(doc.querySelectorAll('.sp'));
  var ctRows=[].slice.call(doc.querySelectorAll('.ct-bg span')), contact=doc.getElementById('contact');
  var darkEls=[doc.getElementById('photos'),doc.getElementById('staff'),contact,doc.querySelector('.ft')];
  var jump=doc.querySelector('.jump');

  /* =========================================================
     レイアウト（ピン留めの長さ）と、位置の計測
     ・スマホのアドレスバーが出入りすると画面の高さが少し変わるが、その時は何もしない（ページの長さが変わって中身が前後するのを防ぐ）
     ・各区画の位置はここでまとめて測っておき、スクロール中は測り直さない（カクつき防止）
     ========================================================= */
  var lastW=-1, O=null, hasSvh=window.CSS&&CSS.supports('height','1svh');
  function box(el,sy){ var r=el.getBoundingClientRect(); return {t:r.top+sy,h:r.height}; }
  function measure(){
    var sy=window.scrollY;
    O={concept:box(concept,sy), odo:box(odoPin,sy), odoTop:parseFloat(getComputedStyle(odoSticky).top)||0, odoH:odoSticky.offsetHeight,
       read:box(read,sy), bl:box(blTrack.parentNode,sy), w:box(wPin,sy), wS:wSticky.offsetHeight,
       st:box(stStage,sy), hs:box(hsStack,sy), ct:box(contact,sy), ft:box(ftCanvas,sy), dark:darkEls.map(function(el){ return box(el,sy); }),
       hsTops:[], hsStick:sheets.length?parseFloat(getComputedStyle(sheets[0]).top)||0:0};
    var acc=O.hs.t+(parseFloat(getComputedStyle(hsStack).paddingTop)||0);
    sheets.forEach(function(s){ O.hsTops.push(acc); acc+=s.offsetHeight; });
    dirty=true;
  }
  function layout(force){
    var w=window.innerWidth, h=window.innerHeight;
    if(!force&&touch&&Math.abs(w-lastW)<2&&Math.abs(h-vh)<160) return;
    lastW=w; vh=h; vw=w;
    fitHS();
    odoPin.style.setProperty('--oh',odoSticky.offsetHeight+'px');
    if(gallery){ gallery.size(); gDrawn=false; }
    /* ピン留めの長さは写真の読み込みを待たずに決める（読み込み後にページの長さが変わって中身が飛ばないように）。
       画面の高さはアドレスバーで変わらない svh で計算する */
    var wTravel=(gallery?gallery.travel:(gN-1)*gCw(wCanvas.clientWidth)*(1+G_GAP))*1.25;
    wPin.style.height=hasSvh?'calc(125svh + '+wTravel+'px)':(vh*1.25+wTravel)+'px';
    if(strip) strip.size();
    measure();
  }
  var mT=0; function remeasure(){ cancelAnimationFrame(mT); mT=requestAnimationFrame(measure); }
  window.addEventListener('resize',function(){ clearTimeout(layout.t); layout.t=setTimeout(function(){ layout(false); },150); });
  window.addEventListener('load',function(){ layout(true); });
  if(doc.fonts&&doc.fonts.ready) doc.fonts.ready.then(remeasure);
  if('ResizeObserver' in window) new ResizeObserver(remeasure).observe(body);  /* 写真の読み込みなどでページの長さが変わった時だけ測り直す */
  layout(true);

  /* =========================================================
     スクロールに合わせた動き（ここでは要素の位置を測らない）
     ========================================================= */
  var lastY=-1, gDrawn=false, curTab=-2, heroCardsEl=doc.getElementById('heroCards');
  var blX=0, blT=0, ctX=0, ctT=0;
  function chase(a,b){ var n=lerp(a,b,.16); return Math.abs(b-n)<.2?b:n; }
  function inView(b,y){ return b.t-y<vh&&b.t+b.h-y>0; }
  function frame(){
    var y=Math.max(0,window.scrollY);  /* iPhone の上端で引っぱった時のマイナスは無視 */
    if(O&&(y!==lastY||dirty)){
      lastY=y; dirty=false;
      /* ヒーロー：写真が上がって傾く・大きな文字はゆっくり */
      if(!touch&&y<vh*1.4){
        heroWrap.style.transform='translate3d(0,'+(y*.35)+'px,0)'; heroWrap.style.opacity=clamp(1-y/(vh*.9),0,1);
        if(heroLive) heroCards.forEach(function(c,i){ var sp=[.9,1.25,1.05,.8][i]; c.style.setProperty('--ty',(-y*sp)+'px'); c.style.setProperty('--sc',1+y/vh*.12); });
      }
      /* MESSAGE：年が 1956 → 2026 と進む・読むと濃くなる */
      if(inView(O.concept,y)){
        var op=clamp((O.odoTop-(O.odo.t-y)+vh*.15)/Math.max(1,O.odo.h-O.odoH),0,1);
        setYear(Math.round(1956+70*op)); odoBar.style.setProperty('--p',op.toFixed(3)); odoJp.classList.toggle('on',op>.97);
        var p=clamp((vh*.86-(O.read.t-y))/(O.read.h+vh*.86-vh*.42),0,1), k=Math.round(p*chars.length);
        if(k!==litCount){ var a=Math.min(k,litCount), b=Math.max(k,litCount); for(var i=a;i<b;i++) chars[i].classList.toggle('on',i<k); litCount=k; marks.forEach(function(m){ m.p.classList.toggle('lit',k>m.last); }); }
      }
      /* 流れる大文字 */
      if(inView(O.bl,y)) blT=-(vh-(O.bl.t-y))*.6;
      /* 曲面ギャラリー：進み具合だけ決める（描くのは下） */
      if(gallery&&inView(O.w,y)) gallery.offset=clamp((y-O.w.t)/Math.max(1,O.w.h-O.wS),0,1)*gallery.travel;
      /* STAFF：似顔絵がそれぞれの速さで動く */
      if(!touch&&inView(O.st,y)){ var q=(O.st.t-y+O.st.h/2-vh/2)/vh; sps.forEach(function(s){ s.style.setProperty('--py',(q*+s.getAttribute('data-depth')*-420)+'px'); }); }
      /* 年表：いま見ているシートのタブ */
      var cur=-1; for(var n=0;n<O.hsTops.length;n++){ if(y>=O.hsTops[n]-O.hsStick-2) cur=n; }
      if(cur!==curTab){ curTab=cur; tabs.forEach(function(t,i){ t.classList.toggle('cur',i===cur); }); }
      /* CONTACT：背景の大きな文字が左右に流れる */
      var ctTop=O.ct.t-y;
      if(inView(O.ct,y)) ctT=(vh-ctTop)*.35;
      /* ヘッダーの文字色（暗い区画の上では白） */
      var dark=false; O.dark.forEach(function(d){ var t=d.t-y; if(t<=40&&t+d.h>40) dark=true; });
      body.classList.toggle('on-dark',dark);
      /* 写真を見るボタン：曲面ギャラリー（中に同じボタンがある）・年表・CONTACT の間は隠す */
      var wTop=O.w.t-y, hsTop=O.hs.t-y;
      jump.classList.toggle('hide',(wTop<vh*.6&&wTop+O.w.h>vh*.4)||(hsTop<vh*.92&&hsTop+O.hs.h>vh*.08)||ctTop<vh*.7||y<vh*.5);
    }
    /* 曲面ギャラリーを描く（スクロールが止まっても、目標の位置まで少しずつ追いつく） */
    if(gallery&&O&&inView(O.w,y)&&(!gDrawn||Math.abs(gallery.cur-gallery.offset)>.3)){
      gallery.cur=lerp(gallery.cur,gallery.offset,.14); if(Math.abs(gallery.cur-gallery.offset)<.3) gallery.cur=gallery.offset;
      gallery.draw(); gDrawn=true;
      var idx=clamp(Math.round(gallery.cur/gallery.step),0,gEntries.length-1); setItem(gEntries[idx].item);
      wTicks.style.transform='translate3d('+(-(gallery.cur*.5)%8)+'px,0,0)';
    }
    /* 流れる大文字：スクロールの位置に少しずつ追いつく（位置が飛び飛びに届いても、なめらかに動く） */
    if(O&&blX!==blT&&inView(O.bl,y)){ blX=chase(blX,blT); blTrack.style.transform='translate3d('+blX+'px,0,0)'; }
    if(O&&ctX!==ctT&&inView(O.ct,y)){ ctX=chase(ctX,ctT); ctRows.forEach(function(s,i){ s.style.transform='translate3d('+((i%2?1:-1)*ctX-(i%2?vw*.4:0))+'px,0,0)'; }); }
    /* フッターの曲面の帯（見えている間はゆっくり自動で流れる） */
    if(strip&&O&&inView(O.ft,y)){ strip.cur+=.6; if(strip.cur>strip.step*stripN*2) strip.cur-=strip.step*stripN; strip.draw(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* =========================================================
     SPECIAL THANKS：ロゴを右から左へ流す。1組が画面幅より長くなるまで並びを繰り返し、
     同じものをもう1組つなげて -50% 動かす（つなぎ目が見えない）。速さは1秒あたり約40px
     ========================================================= */
  var lm=doc.querySelector('.logo-marq');
  if(lm&&!reduced){
    var lmTrack=lm.querySelector('.lm-track'), lmBase=[].slice.call(lmTrack.children);
    lm.classList.add('on');  /* 読み込みを待たずに1列にしておく（後から帯の高さが変わって中身が飛ばないように） */
    var lmBuild=function(){
      lmTrack.innerHTML=''; lmBase.forEach(function(li){ lmTrack.appendChild(li); }); lm.classList.add('on');
      var one=lmTrack.scrollWidth, need=Math.max(1,Math.ceil((window.innerWidth+200)/Math.max(one,1))), set=[], r, k;
      for(r=0;r<need;r++) lmBase.forEach(function(li){ set.push(r?li.cloneNode(true):li); });
      lmTrack.innerHTML=''; set.forEach(function(li){ lmTrack.appendChild(li); });
      set.forEach(function(li){ lmTrack.appendChild(li.cloneNode(true)); });
      [].slice.call(lmTrack.children).forEach(function(li,i){ if(i>=lmBase.length){ li.setAttribute('aria-hidden','true'); var im=li.querySelector('img'); if(im) im.alt=''; } });
      lmTrack.style.setProperty('--dur',Math.round(lmTrack.scrollWidth/2/40)+'s');
    };
    var lmImgs=lm.querySelectorAll('img'), lmLeft=0;
    lmImgs.forEach(function(im){ if(!im.complete){ lmLeft++; im.addEventListener('load',function(){ if(--lmLeft===0) lmBuild(); },{once:true}); im.addEventListener('error',function(){ if(--lmLeft===0) lmBuild(); },{once:true}); } });
    if(!lmLeft) lmBuild();
    var lmW=window.innerWidth; window.addEventListener('resize',function(){ if(Math.abs(window.innerWidth-lmW)>80){ lmW=window.innerWidth; lmBuild(); } });
  }

  /* =========================================================
     カーソル（PCのみ）
     ========================================================= */
  var cur=doc.getElementById('cursor');
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduced){
    var mx=-100,my=-100,cx=-100,cy=-100;
    window.addEventListener('pointermove',function(e){ mx=e.clientX; my=e.clientY; },{passive:true});
    doc.addEventListener('pointerover',function(e){ cur.classList.toggle('big',!!e.target.closest('a,button')); });
    (function loop(){ cx=lerp(cx,mx,.22); cy=lerp(cy,my,.22); cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)'; requestAnimationFrame(loop); })();
  }
})();
