eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('8 5;8 N=7;8 B=18("N");h(B!=""){N=1g(B)}8 e;8 v;8 T;8 19=N*N;h(N%2==1){19--}5=I U();m(i=0;i<N;i++){5.V(I U());m(j=0;j<N;j++){5[i].V({f:0,o:W})}}8 p,q,C,D;8 A=I U();8 R;8 1D;8 w=1E;B=18("w");h(B!=""){w=1g(B)}8 n=w/N;8 1a={x:"#1h","x-1F":"--"};8 1i={"x-X":0,Y:"#1G"};8 J={"x-X":0,Y:"#1h",Z:0.1H};8 K=["#1I","#1J"];8 1j=[{Y:K[0],Z:1},{Y:K[1],Z:1}];8 1k=[{x:K[0],"x-X":10},{x:K[1],"x-X":10}];8 E;1l.1K=t(){R=1L("1M",w,w);m(i=1;i<N;i++){R.O(["M",i*n,0,"L",i*n,w].1m(",")).u(1a);R.O(["M",0,i*n,"L",w,i*n].1m(",")).u(1a)}m(i=0;i<N;i++){m(j=0;j<N;j++){5[i][j].r=R.1N(i*n+n/2,j*n+n/2,0.9*n/2);5[i][j].r.i=i;5[i][j].r.j=j;5[i][j].y=t(){1n(1o.i,1o.j)}}}p=F.G("1O");q=F.G("1P");C=F.G("1Q");D=F.G("1R");1p()};t 1p(){e=1;T=0;v=[0,0];m(i=0;i<N;i++){m(j=0;j<N;j++){h(5[i][j].o){5[i][j].r.1b(5[i][j].y);5[i][j].o=W}5[i][j].f=0;5[i][j].r.u(1i)}}m(i=0;i<A.P;i++){A[i].O.1S()}A=I U();C.l="1c";D.l="11";p.s="1q";p.l="12";q.s="1q";q.l="12";E=[F.G("1T"),F.G("1U")];E[0].s=0;E[1].s=0;1d()}8 1e=N-3;8 13=N-4;t 1r(i,j){m(k=z.1s(0,j-3);k<z.H(1e,j+3);k++){h(5[i][k].f==e&&5[i][k+1].f==e&&5[i][k+2].f==e&&5[i][k+3].f==e){Q([i,k],[i,k+1],[i,k+2],[i,k+3])}}m(k=z.1s(0,i-3);k<z.H(1e,i+3);k++){h(5[k][j].f==e&&5[k+1][j].f==e&&5[k+2][j].f==e&&5[k+3][j].f==e){Q([k,j],[k+1,j],[k+2,j],[k+3,j])}}m(k=-z.H(3,i,j);k<=z.H(0,13-i,13-j);k++){h(5[i+k][j+k].f==e&&5[i+k+1][j+k+1].f==e&&5[i+k+2][j+k+2].f==e&&5[i+k+3][j+k+3].f==e){Q([i+k,j+k],[i+k+1,j+k+1],[i+k+2,j+k+2],[i+k+3,j+k+3])}}m(k=-z.H(3,N-1-i,j);k<=z.H(0,i-3,13-j);k++){h(5[i-k][j+k].f==e&&5[i-k-1][j+k+1].f==e&&5[i-k-2][j+k+2].f==e&&5[i-k-3][j+k+3].f==e){Q([i-k,j+k],[i-k-1,j+k+1],[i-k-2,j+k+2],[i-k-3,j+k+3])}}}t Q(a,b,c,d){m(i=0;i<A.P;i++){h(1t([a,b,c,d],A[i].1u).P>1){14}}A.V({1u:[a,b,c,d],O:R.O(["M",a[0]*n+n/2,a[1]*n+n/2,"L",d[0]*n+n/2,d[1]*n+n/2]).u(1k[e-1])});v[e-1]++}t 1d(){m(i=0;i<N;i++){j=0;15(j<N&&5[i][j].f!=0){j++}h(j<N&&!5[i][j].o){5[i][j].r.u(J).16(5[i][j].y);5[i][j].o=17}j=N-1;15(j>=0&&5[i][j].f!=0){j--}h(j>=0&&!5[i][j].o){5[i][j].r.u(J).16(5[i][j].y);5[i][j].o=17}}m(j=0;j<N;j++){i=0;15(i<N&&5[i][j].f!=0){i++}h(i<N&&!5[i][j].o){5[i][j].r.u(J).16(5[i][j].y);5[i][j].o=17}i=N-1;15(i>=0&&5[i][j].f!=0){i--}h(i>=0&&!5[i][j].o){5[i][j].r.u(J).16(5[i][j].y);5[i][j].o=17}}}t 1n(i,j){5[i][j].r.u(1j[e-1]).1b(5[i][j].y);5[i][j].o=W;5[i][j].f=e;T++;1r(i,j);h(e==1){p.l="12";C.l="11";q.l="1v";D.l="1c";e=2}S{q.l="12";C.l="1c";p.l="1v";D.l="11";e=1}E[0].s=v[0];E[1].s=v[1];h(T==19){1w()}S{1d()}}t 1w(){C.l=D.l="11";h(v[0]>v[1]){p.s="1x";p.l="1y";q.s="1z";q.l="1A"}S h(v[0]<v[1]){q.s="1x";q.l="1y";p.s="1z";p.l="1A"}S{p.s="1B";p.l="1C";q.s="1B";q.l="1C"}m(i=0;i<N;i++){m(j=0;j<N;j++){5[i][j].r.u({Z:0.6});h(5[i][j].o){5[i][j].r.1b(5[i][j].y);5[i][j].o=W}}}}t 1t(a,b){8 c=[];m(8 i=0;i<a.P;i++){m(8 k=0;k<b.P;k++){h(a[i][0]==b[k][0]&&a[i][1]==b[k][1]){c.V(a[i]);1V}}}14 c}t 18(a){a=a.1f(/[\\[]/,"\\\\\\[").1f(/[\\]]/,"\\\\\\]");8 b="[\\\\?&]"+a+"=([^&#]*)";8 c=I 1W(b);8 d=c.1X(1l.1Y.1Z);h(d==20)14"";S 14 21(d[1].1f(/\\+/g," "))}',62,126,'|||||grid|||var||||||turn|piece||if||||className|for|PIECESIZE|valid|p1button|p2button||innerHTML|function|attr|scores|BOARDSIZE|stroke|movef|Math|lines|tmp|p1div|p2div|score_displays|document|getElementById|min|new|TARGET_STYLE|P_COLOURS||||path|length|addLine||else|totalmoves|Array|push|false|width|fill|opacity||notmyturn|inactiveButton|DLIM|return|while|click|true|getParameterByName|maxmoves|GRID_STYLE|unclick|myturn|showValidMoves|HVLIM|replace|parseInt|CCCCCC|DEFAULT_STYLE|P_PIECES|P_LINES|window|join|makeMove|this|startNewGame|Undo|checkNewLines|max|getLineIntersect|line|activeButton|endGame|WINNER|winner|LOSER|loser|DRAW|draw|targets|900|dasharray|000000|23|cc0404|F29F05|onload|Raphael|gameBoard|circle|bottomButton|topButton|p1turn|p2turn|remove|p1score|p2score|break|RegExp|exec|location|href|null|decodeURIComponent'.split('|'),0,{}))