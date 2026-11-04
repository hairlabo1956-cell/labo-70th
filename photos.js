/* LABO 70th — 写真ページ
   写真の一覧は photos-data.js（1枚＝1行「番号|幅|高さ」）。写真の本体は photos/prep/番号.jpg、一覧用の小さい写真は photos/prep/t/番号.jpg */
(function(){
  var doc=document, DATA=window.LABO_PHOTOS||{}, ALBUMS={
    prep:{date:'10.30',name:'準備',file:'LABO70th_1030'},
    day:{date:'10.31',name:'当日',file:'LABO70th_1031'}
  };
  var ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10.5 12 15.5 17 10.5M4.5 20h15"/></svg>';
  var ua=navigator.userAgent;
  var ios=/iP(hone|ad|od)/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var inApp=/\bLine\/|Instagram|FBAN|FBAV|FB_IAB|MicroMessenger|Twitter|TikTok|musical_ly/i.test(ua);

  function list(key){
    return (DATA[key]||[]).map(function(s){ var p=s.split('|'); return {no:p[0],w:+p[1],h:+p[2]}; });
  }
  function fullUrl(key,p){ return 'photos/'+key+'/'+p.no+'.jpg'; }
  function thumbUrl(key,p){ return 'photos/'+key+'/t/'+p.no+'.jpg'; }
  function fileName(key,p){ return ALBUMS[key].file+'_'+p.no+'.jpg'; }

  /* =========================================================
     アルバムと写真の並び
     ========================================================= */
  var grid=doc.getElementById('grid'), empty=doc.getElementById('empty'), ttl=doc.getElementById('galleryTtl'), cur='day', photos=[];
  Object.keys(ALBUMS).forEach(function(key){
    var l=list(key), cover=doc.querySelector('[data-cover="'+key+'"]'), count=doc.querySelector('[data-count="'+key+'"]');
    count.textContent=l.length?l.length+'枚':'準備中';
    var c=l.filter(function(p){ return p.no===(DATA.covers||{})[key]; })[0]||l[0];
    if(c) cover.src=thumbUrl(key,c);
  });
  function show(key){
    cur=ALBUMS[key]?key:'day'; photos=list(cur);
    ttl.textContent=ALBUMS[cur].date+' '+ALBUMS[cur].name+'の写真';
    doc.querySelectorAll('.album').forEach(function(a){ var on=a.getAttribute('data-album')===cur; a.classList.toggle('on',on); if(on) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
    empty.hidden=photos.length>0;
    grid.innerHTML=photos.map(function(p,i){
      return '<li class="tile"><button class="t-open" type="button" data-i="'+i+'" aria-label="写真 '+p.no+' を拡大"><img src="'+thumbUrl(cur,p)+'" alt="" loading="lazy" decoding="async"></button>'+
        '<a class="t-dl" data-i="'+i+'" href="'+fullUrl(cur,p)+'" download="'+fileName(cur,p)+'" aria-label="写真 '+p.no+' を保存">'+ICON+'</a></li>';
    }).join('');
  }
  function fromHash(){ return location.hash.slice(1); }
  show(fromHash());
  window.addEventListener('hashchange',function(){ var k=fromHash(); if(ALBUMS[k]&&k!==cur) show(k); });
  /* アルバムを選んだら、写真の並びの頭まで動かす */
  doc.getElementById('albums').addEventListener('click',function(e){
    var a=e.target.closest('.album'); if(!a) return;
    e.preventDefault(); var k=a.getAttribute('data-album');
    if(k!==cur){ history.replaceState(null,'','#'+k); show(k); }
    doc.getElementById('gallery').scrollIntoView();
  });

  /* =========================================================
     保存
     ・パソコン・Android：そのままダウンロード（<a download>）
     ・iPhone：ダウンロードだと「ファイル」アプリに入ってしまうので、共有の画面を出して「画像を保存」を選べるようにする
     ・LINE や Instagram の中で開いている時：保存ボタンが効かないことがあるので、拡大して長押しの案内を出す
     ========================================================= */
  var sheet=doc.getElementById('sheet'), sheetTx=doc.getElementById('sheetTx'), sheetBtn=doc.getElementById('sheetBtn'), sheetAct=null, sheetT=0;
  function say(text,act){
    clearTimeout(sheetT); sheetTx.textContent=text; sheetAct=act||null; sheetBtn.hidden=!act; sheet.hidden=false;
    if(!act) sheetT=setTimeout(function(){ sheet.hidden=true; },6000);
  }
  sheetBtn.addEventListener('click',function(){ var f=sheetAct; sheet.hidden=true; if(f) f(); });
  function shareFile(file){
    return navigator.share({files:[file]}).then(function(){ sheet.hidden=true; }).catch(function(err){
      if(err&&err.name==='AbortError'){ sheet.hidden=true; return; }  /* 自分で閉じた */
      /* 準備に時間がかかると、押した操作として認められないことがある＝もう一度押してもらう */
      say('保存の準備ができました',function(){ shareFile(file); });
    });
  }
  function saveIOS(key,p,i){
    say('保存の準備をしています…');
    fetch(fullUrl(key,p)).then(function(r){ if(!r.ok) throw new Error(r.status); return r.blob(); }).then(function(b){
      var file=new File([b],fileName(key,p),{type:'image/jpeg'});
      if(navigator.canShare({files:[file]})) return shareFile(file);
      sheet.hidden=true; openLb(i,true);
    }).catch(function(){ say('うまく読み込めませんでした。少し待ってからお試しください。'); });
  }
  /* 保存のボタンが押された時。<a download> に任せる時は何もしない */
  function onSave(e,i){
    if(inApp){ e.preventDefault(); openLb(i,true); return; }
    if(ios&&navigator.canShare&&navigator.share){ e.preventDefault(); saveIOS(cur,photos[i],i); }
  }
  grid.addEventListener('click',function(e){
    var dl=e.target.closest('.t-dl'); if(dl){ onSave(e,+dl.getAttribute('data-i')); return; }
    var op=e.target.closest('.t-open'); if(op) openLb(+op.getAttribute('data-i'));
  });

  /* =========================================================
     拡大表示
     ========================================================= */
  var lb=doc.getElementById('lb'), lbImg=doc.getElementById('lbImg'), lbNo=doc.getElementById('lbNo'), lbDl=doc.getElementById('lbDl'), lbHint=doc.getElementById('lbHint');
  var lbPrev=doc.getElementById('lbPrev'), lbNext=doc.getElementById('lbNext'), lbClose=doc.getElementById('lbClose'), lbI=-1, lastFocus=null, hintOn=false, lbToken=0;
  function draw(i){
    lbI=i; var p=photos[i], full=fullUrl(cur,p), token=++lbToken;
    lbImg.src=thumbUrl(cur,p);  /* まず小さい写真を出して、本体が読めたら置き換える */
    var im=new Image(); im.onload=function(){ if(token===lbToken) lbImg.src=full; }; im.src=full;
    if(photos[i+1]) (new Image()).src=fullUrl(cur,photos[i+1]);
    lbImg.alt=ALBUMS[cur].name+'の写真 '+p.no;
    lbNo.textContent=ALBUMS[cur].name+' No.'+p.no+'（'+(i+1)+' / '+photos.length+'）';
    lbDl.href=full; lbDl.setAttribute('download',fileName(cur,p));
    lbPrev.disabled=i===0; lbNext.disabled=i===photos.length-1;
    lbHint.hidden=!(inApp||hintOn); lbDl.hidden=inApp;
  }
  function openLb(i,hint){
    var was=!lb.hidden; hintOn=!!hint; draw(i);
    if(was) return;
    lastFocus=doc.activeElement; lb.hidden=false; doc.body.classList.add('lb-open'); lbClose.focus();
    history.pushState({lb:1},'');  /* スマホの「戻る」で拡大を閉じる */
  }
  function closeLb(fromPop){
    if(lb.hidden) return;
    lb.hidden=true; doc.body.classList.remove('lb-open'); sheet.hidden=true; lbImg.removeAttribute('src');
    if(lastFocus&&lastFocus.focus) lastFocus.focus({preventScroll:true});
    if(!fromPop) history.back();
  }
  function step(d){ var n=lbI+d; if(n>=0&&n<photos.length) draw(n); }
  lbClose.addEventListener('click',function(){ closeLb(); });
  lbPrev.addEventListener('click',function(){ step(-1); });
  lbNext.addEventListener('click',function(){ step(1); });
  lbDl.addEventListener('click',function(e){ onSave(e,lbI); });
  window.addEventListener('popstate',function(){ closeLb(true); });
  doc.addEventListener('keydown',function(e){
    if(lb.hidden) return;
    if(e.key==='Escape') closeLb(); else if(e.key==='ArrowLeft') step(-1); else if(e.key==='ArrowRight') step(1);
  });
  /* 背景を押したら閉じる・左右にスワイプで前後の写真へ */
  var stage=doc.getElementById('lbStage'), tx=0, ty=0;
  stage.addEventListener('click',function(e){ if(e.target===stage) closeLb(); });
  stage.addEventListener('touchstart',function(e){ tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
  stage.addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5) step(dx<0?1:-1);
  },{passive:true});

  /* ページトップへ：少し下に進んでから出す */
  var toTop=doc.getElementById('toTop');
  function topBtn(){ toTop.classList.toggle('hide',window.scrollY<window.innerHeight*.7); }
  window.addEventListener('scroll',topBtn,{passive:true}); topBtn();
})();
