// index.js

// ----- 工具函数 -----
async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function genToken(len=32) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let t = '';
    const rand = new Uint32Array(len);
    crypto.getRandomValues(rand);
    for(let i=0;i<len;i++) t += chars[rand[i]%chars.length];
    return t;
}
const CHAR_SETS = {
    upper: "ABCDEFGHJKMNPQRSTUVWXYZ",
    lower: "abcdefghjkmnpqrstuvwxyz",
    digit: "23456789",
    special: "!@#$%^&*"
};
function getCharset(opts) {
    let cs = "";
    if (opts.upper) cs += CHAR_SETS.upper;
    if (opts.lower) cs += CHAR_SETS.lower;
    if (opts.digit) cs += CHAR_SETS.digit;
    if (opts.special) cs += CHAR_SETS.special;
    return cs;
}
function generatePassword(length, opts = {upper: true, lower:true, digit:true, special:true}) {
    const charset = getCharset(opts);
    if (!charset) throw new Error("No charset selected!");
    let pw = "";
    const randoms = new Uint32Array(length);
    crypto.getRandomValues(randoms);
    for (let i = 0; i < length; i++)
        pw += charset[randoms[i] % charset.length];
    return pw;
}

// ----- HTML 页面 -----
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>密码管理器</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css?family=Inter:400,700&display=swap" rel="stylesheet">
<style>
:root {
  --main-bg: #f6f8fa;
  --primary: #2563eb;
  --primary-dark: #1e40af;
  --border: #d1d5db;
  --danger: #e11d48;
  --radius: 10px;
}
body {
  font-family: 'Inter', Arial, sans-serif;
  background: var(--main-bg);
  margin: 0;
  padding: 0;
}
.container {
  max-width: 420px;
  margin: 36px auto;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 0 8px 32px 0 rgba(40,60,120,.10);
  padding: 28px 20px 20px 20px;
}
h2, h3 {
  color: var(--primary-dark);
  margin-top: 0;
  font-weight: 700;
  letter-spacing: .2px;
}
label {
  display: inline-block;
  margin-right: 10px;
  font-size: 15px;
  color: #333;
  vertical-align: middle;
}
input[type=text], input[type=password], input[type=number] {
  width: 95%;
  padding: 8px 10px;
  margin: 8px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border .2s;
  font-size: 15px;
  box-sizing: border-box;
}
input:focus {
  border: 1.5px solid var(--primary);
  outline: none;
  background: #eff4ff;
}
button {
  min-width: 74px;
  margin: 6px 3px 6px 0;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 9px 18px;
  font-size: 15.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(60,97,255,.08);
  transition: background .15s;
}
button:hover { background: var(--primary-dark);}
button[disabled] { background: #b9c7ef; cursor: not-allowed;}
input[type=checkbox] { margin-right: 2px;}
hr {
  border: none;
  border-top: 1px solid #e4e8ef;
  margin: 28px 0 18px 0;
}
.form-row {
  margin: 9px 0 12px 0;
}
#lmsg, #savemsg {
  min-height: 19px;
  font-size: 14px;
  margin-top: 3px;
  color: var(--danger);
}
.pwlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pwlist-header h3 { font-size:20px; margin:0; font-weight:700;}
#pwlist {
  list-style: none;
  padding: 0;
}
.pwrow {
  background: #fafcff;
  margin-bottom: 13px;
  border-radius: 8px;
  border: 1px solid #e8eaf0;
  padding: 10px 11px 8px 11px;
  font-size: 15.6px;
  color: #22315a;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px 12px;
}
.pwrow b {
  min-width: 90px;
  margin-right: 6px;
  color: var(--primary-dark);
}
.pwrow button {
  min-width: 44px;
  padding: 5px 12px;
  font-size: 14.2px;
  margin-left: 4px;
  margin-bottom: 0;
}
.pwrow button:last-child { background: #f43f5e; }
.pwrow button:last-child:hover { background: #be123c; }
@media (max-width:500px){
  .container {padding:10px 1px 12px 2px;}
  h2 { font-size: 19px;}
  label, .pwrow {font-size: 101%;}
}
#mainarea .desc {font-size:14px; color:#788;}
::-webkit-scrollbar {width:8px;background:#f3f6fb;}
::-webkit-scrollbar-thumb {background:#e3eaf6;border-radius:5px;}
</style>
</head>
<body>
<div class="container">
<h2>密码管理器</h2>
<div id="loginbox">
  <label>用户名</label><br>
  <input id="luser" type="text" placeholder="用户名"><br>
  <label>密码</label><br>
  <input id="lpass" type="password" placeholder="密码"><br>
  <button onclick="register()">注册</button>
  <button onclick="login()">登录</button>
  <div id="lmsg"></div>
</div>
<div id="mainarea" style="display:none">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <span style="font-weight:600;font-size:16.3px;">欢迎，<span id="uname"></span></span>
    <button onclick="logout()" style="padding:5px 13px;font-size:13.1px;">退出</button>
  </div>
  <hr>
  <div class="desc">快速生成、保存和管理你的密码条目</div>
  <div class="form-row">
    <label><b>生成密码</b></label><br>
    <span>
      长度 <input type="number" id="pwlen" value="16" min="4" max="64" style="width:54px;">
      <label><input type="checkbox" id="up" checked>大写</label>
      <label><input type="checkbox" id="low" checked>小写</label>
      <label><input type="checkbox" id="dig" checked>数字</label>
      <label><input type="checkbox" id="sp" checked>特殊</label>
    </span>
    <br>
    <button onclick="genpw()" style="margin-left:0;">生成</button>
    <input id="pwout" style="width:60%">
  </div>
  <div class="form-row">
    <label><b>保存密码</b></label><br>
    名称: <input id="savename" style="width:58%">
    <button onclick="savepw()">保存</button>
    <span id="savemsg"></span>
  </div>
  <div class="pwlist-header">
    <h3>密码库</h3>
    <span>
      <button onclick="listPws()" style="padding:6px 15px;font-size:13px;">刷新</button>
      <button onclick="exportAll()" style="padding:6px 14px;font-size:13px;">导出CSV</button>
    </span>
  </div>
  <ul id="pwlist"></ul>
</div>
</div>
<script>
let token = '';
let editName = null;
function show(id) {
    document.getElementById('loginbox').style.display = id==='login'?'':'none';
    document.getElementById('mainarea').style.display = id==='main'?'':'none';
}
function register() {
    let u = luser.value.trim(), p = lpass.value;
    lmsg.textContent = '';
    if (!u||!p) return lmsg.textContent='请输入用户名和密码';
    fetch('/register', {
        method: 'POST',
        body: JSON.stringify({username:u, password:p}),
        headers: {'content-type':'application/json'}
    }).then(r=>r.json()).then(d=>{
        if(d.ok){lmsg.style.color="#22b454";lmsg.textContent="注册成功，请登录";} 
        else{ lmsg.style.color="#e11d48"; lmsg.textContent=d.error||"错误";}
    });
}
function login() {
    let u = luser.value.trim(), p = lpass.value;
    lmsg.textContent = '';
    if (!u||!p) return lmsg.textContent='请输入用户名和密码';
    fetch('/login', {
        method: 'POST',
        body: JSON.stringify({username:u, password:p}),
        headers: {'content-type':'application/json'}
    }).then(r=>r.json()).then(d=>{
        if(d.ok){
            token = d.token;
            localStorage.setItem('token',token);
            uname.textContent = u;
            show('main');
            listPws();
        } else {
            lmsg.style.color="#e11d48"; 
            lmsg.textContent = d.error||"登录失败";
        }
    });
}
function logout() {
    token=''; localStorage.removeItem('token'); show('login');
}
function authHead(){return token? {'x-auth-token':token} : {}; }
function genpw() {
    document.getElementById('savemsg').textContent='';
    fetch('/generate', {
        method:'POST',
        body:JSON.stringify({
            length:Number(pwlen.value)||16,
            upper:up.checked,
            lower:low.checked,
            digit:dig.checked,
            special:sp.checked
        }),
        headers:{'content-type':'application/json',...authHead()}
    }).then(r=>r.json()).then(d=>{
        if(d.ok) pwout.value = d.password;
        else pwout.value = d.error || "失败";
    });
}
function savepw() {
    let name = savename.value.trim();
    let password = pwout.value;
    savemsg.textContent = '';
    if (!name || !password) return savemsg.textContent="名称和密码不能为空";
    if (editName && editName !== name) {
        savemsg.textContent = "编辑时不能修改名称";
        return;
    }
    let url = '/save';
    let method = 'POST';
    let data = {name, password};
    if (editName) {
        url = '/edit';
        data.oldName = editName;
        method = 'POST';
    }
    fetch(url, {
        method,
        body:JSON.stringify(data),
        headers:{'content-type':'application/json',...authHead()}
    }).then(r=>r.json()).then(d=>{
        savemsg.style.color = d.ok ? "#22b454" : "#e11d48";
        savemsg.textContent = d.ok ? (editName ? "修改成功":"保存成功") : ("失败: "+(d.error||""));
        if (d.ok) {
            setTimeout(listPws,400);
            savename.value = '';
            pwout.value = '';
            editName = null;
            document.getElementById('savename').disabled = false;
        }
    });
}
function listPws() {
    pwlist.innerHTML = '';
    editName = null;
    document.getElementById('savename').disabled = false;
    savename.value = '';
    pwout.value = '';
    fetch('/list', {headers: authHead()})
        .then(r=>r.json())
        .then(d=>{
            if (d.ok && d.data) {
                for(let rec of d.data){
                    let li = document.createElement('li');
                    li.className = "pwrow";
                    li.innerHTML = '<b>'+esc(rec.name)+'</b> <span>• '+esc(rec.password)+'</span> ';
                    let editbtn = document.createElement('button');
                    editbtn.textContent = '编辑';
                    editbtn.onclick = ()=>editpw(rec.name, rec.password);
                    li.appendChild(editbtn);
                    let delbtn = document.createElement('button');
                    delbtn.textContent = '删除';
                    delbtn.onclick = ()=>delpw(rec.name);
                    li.appendChild(delbtn);
                    pwlist.appendChild(li);
                }
            }
        });
}
function esc(x){return x.replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function editpw(name, pw) {
    savename.value = name;
    pwout.value = pw;
    editName = name;
    document.getElementById('savename').disabled = true;
    savemsg.style.color="#2563eb";
    savemsg.textContent = "正在编辑";
}
function delpw(name){
    if (confirm('确定删除 "'+name+'"?'))
    fetch('/delete?name='+encodeURIComponent(name),{method:'POST', headers: authHead()})
    .then(r=>r.json()).then(d=>{
        if(d.ok) listPws();
        else alert('删除失败:'+d.error);
    });
}
function exportAll() {
    fetch('/export', {headers:authHead()})
    .then(r=>r.text()).then(csv=>{
        let blob = new Blob([csv], {type:'text/csv'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'passwords.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url);}, 100);
    });
}
window.onload = function(){
    token = localStorage.getItem('token')||'';
    if(token) show('main'), listPws();
}
</script>
</body>
</html>
`;

// ----- Worker 后端逻辑 -----
async function getUser(env, user) {
    if (!user) return null;
    let raw = await env.USERS.get('user:'+user);
    return raw ? JSON.parse(raw) : null;
}
async function auth(request, env) {
    let token = request.headers.get('x-auth-token');
    if (!token) return null;
    let user = await env.USERS.get('token:'+token);
    return user;
}
async function listUserPasswords(env, user) {
    let raw = await env.PASSWORDS.get('pwlist:'+user);
    let arr = [];
    if (raw) try{arr=JSON.parse(raw);}catch{}
    return arr;
}
async function setUserPassword(env, user, pArr) {
    await env.PASSWORDS.put('pwlist:'+user, JSON.stringify(pArr));
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 首页界面
        if (url.pathname === '/') return new Response(HTML, {headers:{'content-type':'text/html'}});

        // 注册
        if (url.pathname === '/register' && request.method==='POST') {
            let {username, password} = await request.json();
            if (!username||!password) return Response.json({ok:false, error:"缺少用户名或密码"});
            username = username.trim().toLowerCase();
            if (!/^[a-z0-9_\-]{3,30}$/.test(username)) return Response.json({ok:false,error:'用户名不合法，只允许字母/数字/下划线/短横线，3-30长度'});
            if (await env.USERS.get('user:'+username)) return Response.json({ok:false,error:'用户已存在'});
            const hpwd = await sha256(password);
            await env.USERS.put('user:'+username, JSON.stringify({username,hpwd}));
            return Response.json({ok:true});
        }

        // 登录
        if (url.pathname==='/login' && request.method==='POST') {
            let {username, password} = await request.json();
            if (!username||!password) return Response.json({ok:false, error:"缺少用户名或密码"});
            username = username.trim().toLowerCase();
            let userObj = await getUser(env, username);
            if (!userObj) return Response.json({ok:false,error:'用户不存在'});
            const hpwd = await sha256(password);
            if (userObj.hpwd !== hpwd) return Response.json({ok:false,error:'密码错误'});
            const token = genToken();
            await env.USERS.put('token:'+token, username, {expirationTtl: 86400*7});
            return Response.json({ok:true, token});
        }

        // 下方所有 API 只对登录用户有效
        const username = await auth(request, env);
        if (!username) return Response.json({ok:false, error:'未登录或Token无效'}, {status:401});

        // 随机密码生成
        if (url.pathname === '/generate' && request.method==='POST') {
            try {
                const body = await request.json();
                const {
                    length = 16,
                    upper = true,
                    lower = true,
                    digit = true,
                    special = true
                } = body;
                if (!upper && !lower && !digit && !special)
                    return Response.json({ok: false, error: "No charset selected"});
                const n = Math.max(4, Math.min(64, Number(length) || 16));
                const pw = generatePassword(n, {upper, lower, digit, special});
                return Response.json({ok:true, password:pw});
            } catch (e) {
                return Response.json({ok:false, error: "请求有误"});
            }
        }

        // 新增一条密码记录
        if (url.pathname==='/save' && request.method==='POST') {
            const {name, password} = await request.json();
            if (!name||!password) return Response.json({ok:false, error: "名称和密码不能为空"});
            let arr = await listUserPasswords(env, username);
            if (arr.find(x=>x.name===name)) return Response.json({ok:false,error:'名称已存在'});
            arr.push({name,password});
            await setUserPassword(env, username, arr);
            return Response.json({ok:true});
        }

        // 编辑密码内容（仅可编辑密码，不可改名）
        if (url.pathname==='/edit' && request.method==='POST') {
            const {oldName, name, password} = await request.json();
            if (!oldName || !password) return Response.json({ok:false, error:'缺少参数'});
            let arr = await listUserPasswords(env, username);
            let idx = arr.findIndex(x=>x.name===oldName);
            if (idx<0) return Response.json({ok:false, error:"没有该记录"});
            arr[idx].password = password;
            await setUserPassword(env, username, arr);
            return Response.json({ok:true});
        }

        // 列出所有记录
        if (url.pathname==='/list' && request.method==='GET') {
            let arr = await listUserPasswords(env, username);
            return Response.json({ok:true, data:arr});
        }

        // 删除一条记录
        if (url.pathname==='/delete' && request.method==='POST') {
            let name = url.searchParams.get('name');
            if (!name) return Response.json({ok:false,error:'缺少名称'});
            let arr = await listUserPasswords(env, username);
            let nArr = arr.filter(x=>x.name!==name);
            if (nArr.length===arr.length) return Response.json({ok:false,error:'没有该记录'});
            await setUserPassword(env, username, nArr);
            return Response.json({ok:true});
        }

        // 导出为 CSV
        if (url.pathname==='/export' && request.method==='GET') {
            let arr = await listUserPasswords(env, username);
            let csv = '名称,密码\n'+arr.map(x=>`"${x.name.replace(/"/g,'""')}","${x.password.replace(/"/g,'""')}"`).join('\n');
            return new Response(csv, {headers:{'content-type':'text/csv; charset=utf-8'}});
        }

        return new Response('404 Not Found', {status:404});
    }
};
