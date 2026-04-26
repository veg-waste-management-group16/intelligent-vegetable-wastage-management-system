import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api';

// ── Translation strings ────────────────────────────────────────────────────
const T = {
  en: {
    tagline: "Sri Lanka's Farm-to-Table Platform",
    sub: "Connecting farmers & customers across all 25 districts",
    chooseLang: "Choose your language",
    continue: "Continue",

    // Login
    welcomeBack: "Welcome Back",
    signInSub: "Sign in to your VegLife account",
    email: "Email Address",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signingIn: "Signing in…",
    noAccount: "Don't have an account?",
    registerHere: "Register here",

    // Register
    joinVegLife: "Join VegLife",
    joinSub: "Create your account",
    iAmA: "I am a",
    farmer: "Farmer",
    farmerSub: "Sell your harvest",
    customer: "Customer",
    customerSub: "Buy fresh produce",
    change: "Change",

    // Personal
    personalInfo: "Personal Information",
    profilePhoto: "Click to upload profile photo",
    fullName: "Full Name",
    fullNamePh: "Kamal Perera",
    emailPh: "kamal@example.com",
    phone: "Phone Number",
    phonePh: "0771234567",
    nic: "NIC Number",
    nicPh: "123456789V or 12 digits",
    passwordLabel: "Password",
    passwordPh: "Min 6 chars + special char",
    confirmPassword: "Confirm Password",
    confirmPh: "Repeat password",

    // Farm
    farmInfo: "Farm Information",
    district: "District",
    districtPh: "Select district…",
    farmName: "Farm Name / Village",
    farmNamePh: "e.g. Green Valley Farm, Peradeniya",
    cultivatedArea: "Cultivated Area (ha)",
    cultivatedPh: "e.g. 2.5",
    experience: "Years of Experience",
    experiencePh: "e.g. 10",
    vegetables: "Cultivated Vegetables",
    vegsSelected: (n) => `✓ ${n} vegetable${n > 1 ? 's' : ''} selected`,

    createAccount: "Create Account",
    creatingAccount: "Creating account…",
    alreadyAccount: "Already have an account?",
    signInLink: "Sign in",

    // Forgot / OTP / Reset
    resetPassword: "Reset Password",
    resetSub: "Enter your email to receive a 6-digit OTP",
    sendOtp: "Send OTP",
    sending: "Sending…",
    backToLogin: "← Back to login",
    enterOtp: "Enter OTP",
    otpSub: (email) => `Check your email at ${email}`,
    otpDevNote: "(or check the backend console in dev mode)",
    otpLabel: "6-Digit OTP",
    otpPh: "000000",
    verifyOtp: "Verify OTP",
    verifying: "Verifying…",
    newPassword: "New Password",
    newPasswordSub: "Choose a strong new password",
    newPasswordLabel: "New Password",
    resetBtn: "Reset Password",
    resetting: "Resetting…",

    // Errors
    errEmail: "Email is required.",
    errPassword: "Password is required.",
    errRole: "Please select a role.",
    errName: "Full name is required.",
    errPhone: "Phone must be 10 digits.",
    errNic: "NIC: 9 digits+V/X or 12 digits.",
    errPasswordMin: "Min 6 characters.",
    errPasswordMatch: "Passwords do not match.",
    errDistrict: "District is required.",
    errFarmName: "Farm name is required.",
    errArea: "Cultivated area is required.",
    errVegs: "Select at least one vegetable.",
    errOtp: "OTP is required.",
    errNewPassword: "Min 6 characters.",

    // Success
    successFarmer: "✅ Registered! Your account is pending admin approval.",
    successCustomer: "✅ Registered! You can now log in.",

    footer: "VegLife © 2025 · Sri Lanka · Farm-to-Table Platform",
  },

  si: {
    tagline: "ශ්‍රී ලංකාවේ ගොවි-ගෙදර වේදිකාව",
    sub: "දිස්ත්‍රික්ක 25 පුරා ගොවීන් හා ගනුදෙනුකරුවන් සම්බන්ධ කරයි",
    chooseLang: "භාෂාව තෝරන්න",
    continue: "ඉදිරියට යන්න",

    welcomeBack: "නැවත සාදරයෙන් පිළිගනිමු",
    signInSub: "ඔබගේ VegLife ගිණුමට ලොග් වන්න",
    email: "විද්‍යුත් තැපෑල",
    password: "මුරපදය",
    forgotPassword: "මුරපදය අමතකද?",
    signIn: "ඇතුල් වන්න",
    signingIn: "ඇතුල් වෙමින්…",
    noAccount: "ගිණුමක් නැද්ද?",
    registerHere: "ලියාපදිංචි වන්න",

    joinVegLife: "VegLife හා එකතු වන්න",
    joinSub: "ඔබගේ ගිණුම සාදන්න",
    iAmA: "මම",
    farmer: "ගොවියෙකු",
    farmerSub: "අස්වනු විකිණීම",
    customer: "ගනුදෙනුකරුවෙකු",
    customerSub: "නැවුම් අස්වනු මිලදී ගැනීම",
    change: "වෙනස් කරන්න",

    personalInfo: "පෞද්ගලික තොරතුරු",
    profilePhoto: "ඡායාරූපය උඩුගත කිරීමට ක්ලික් කරන්න",
    fullName: "සම්පූර්ණ නම",
    fullNamePh: "කමල් පෙරේරා",
    emailPh: "kamal@example.com",
    phone: "දුරකතන අංකය",
    phonePh: "0771234567",
    nic: "ජාතික හැඳුනුම්පත් අංකය",
    nicPh: "123456789V හෝ අංක 12ක්",
    passwordLabel: "මුරපදය",
    passwordPh: "අවම අක්ෂර 6 + විශේෂ අක්ෂරයක්",
    confirmPassword: "මුරපදය තහවුරු කරන්න",
    confirmPh: "මුරපදය නැවත ඇතුළු කරන්න",

    farmInfo: "ගොවිපල තොරතුරු",
    district: "දිස්ත්‍රික්කය",
    districtPh: "දිස්ත්‍රික්කය තෝරන්න…",
    farmName: "ගොවිපල නම / ගම",
    farmNamePh: "උදා: කොළ මිදුල ගොවිපල, පේරාදෙණිය",
    cultivatedArea: "වගා භූමිය (හෙක්ටයාර්)",
    cultivatedPh: "උදා: 2.5",
    experience: "අත්දැකීම් වසර",
    experiencePh: "උදා: 10",
    vegetables: "වගා කරන එළවළු",
    vegsSelected: (n) => `✓ එළවළු ${n}ක් තෝරා ඇත`,

    createAccount: "ගිණුම සාදන්න",
    creatingAccount: "ගිණුම සාදමින්…",
    alreadyAccount: "දැනටමත් ගිණුමක් ඇද්ද?",
    signInLink: "ඇතුල් වන්න",

    resetPassword: "මුරපදය යළි සකසන්න",
    resetSub: "OTP ලබා ගැනීමට ඔබගේ විද්‍යුත් ලිපිනය ඇතුළු කරන්න",
    sendOtp: "OTP යවන්න",
    sending: "යවමින්…",
    backToLogin: "← පිවිසීමට ආපසු",
    enterOtp: "OTP ඇතුළු කරන්න",
    otpSub: (email) => `${email} හි ඔබගේ විද්‍යුත් ලිපිය පරීක්ෂා කරන්න`,
    otpDevNote: "(හෝ dev mode හි backend console පරීක්ෂා කරන්න)",
    otpLabel: "OTP අංකය (ඉලක්කම් 6)",
    otpPh: "000000",
    verifyOtp: "OTP තහවුරු කරන්න",
    verifying: "තහවුරු කරමින්…",
    newPassword: "නව මුරපදය",
    newPasswordSub: "ශක්තිමත් නව මුරපදයක් තෝරන්න",
    newPasswordLabel: "නව මුරපදය",
    resetBtn: "මුරපදය යළි සකසන්න",
    resetting: "යළි සකසමින්…",

    errEmail: "විද්‍යුත් ලිපිනය අවශ්‍යය.",
    errPassword: "මුරපදය අවශ්‍යය.",
    errRole: "කාර්යභාරය තෝරන්න.",
    errName: "සම්පූර්ණ නම අවශ්‍යය.",
    errPhone: "දුරකතන අංකය ඉලක්කම් 10ක් විය යුතුය.",
    errNic: "ජා.හැ.අ.: ඉලක්කම් 9+V/X හෝ ඉලක්කම් 12.",
    errPasswordMin: "අවම අක්ෂර 6.",
    errPasswordMatch: "මුරපද නොගැලපේ.",
    errDistrict: "දිස්ත්‍රික්කය අවශ්‍යය.",
    errFarmName: "ගොවිපල නම අවශ්‍යය.",
    errArea: "වගා භූමිය අවශ්‍යය.",
    errVegs: "අවම එළවළු වර්ගයක් තෝරන්න.",
    errOtp: "OTP අවශ්‍යය.",
    errNewPassword: "අවම අක්ෂර 6.",

    successFarmer: "✅ ලියාපදිංචිය සාර්ථකයි! ඔබගේ ගිණුම admin අනුමැතිය සඳහා අපේක්ෂාවෙන් ඇත.",
    successCustomer: "✅ ලියාපදිංචිය සාර්ථකයි! දැන් ලොග් වන්න.",

    footer: "VegLife © 2025 · ශ්‍රී ලංකා · ගොවි-ගෙදර වේදිකාව",
  },
};

const SL_VEGETABLES = {
  en: ['Cabbage','Beans','Tomato','Cauliflower','Potato','Okra','Brinjal','Green Chilli','Onion','Carrot'],
  si: ['ගෝවා','බෝංචි','තක්කාලි','මල් ගෝවා','අල','බෑමිය','වම්බටු','මිරිස්','ළූණු','කැරට්'],
};

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo',
  'Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

// ── Field component ────────────────────────────────────────────────────────
function Field({ label, id, type='text', placeholder, maxLength, form, onChange, errs, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:'block', fontSize:'0.78rem', fontWeight:700,
        color:'#4a5c4a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:7 }}>
        {label}{required && <span style={{color:'#c0392b'}}> *</span>}
      </label>
      <input type={type} value={form[id] || ''} onChange={e => onChange(id, e.target.value)}
        placeholder={placeholder} maxLength={maxLength}
        style={{ width:'100%', padding:'13px 16px',
          border:`1.5px solid ${errs[id] ? '#c0392b' : '#d0e8c8'}`,
          borderRadius:12, fontSize:'0.95rem', fontFamily:"'DM Sans',sans-serif",
          background:'#fafcfa', outline:'none', color:'#1a2e1a',
          transition:'border 0.2s, box-shadow 0.2s', boxSizing:'border-box' }}
        onFocus={e => { e.target.style.borderColor='#4a9e3f'; e.target.style.boxShadow='0 0 0 3px rgba(74,158,63,0.1)'; }}
        onBlur={e => { if (!errs[id]) { e.target.style.borderColor='#d0e8c8'; e.target.style.boxShadow='none'; } }}
      />
      {errs[id] && <div style={{fontSize:'0.78rem',color:'#c0392b',marginTop:5,display:'flex',alignItems:'center',gap:4}}>⚠ {errs[id]}</div>}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [lang, setLang]             = useState(null); // null = language picker screen
  const [mode, setMode]             = useState('login');
  const [form, setForm]             = useState({});
  const [errs, setErrs]             = useState({});
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [msgType, setMsgType]       = useState('');
  const [otpEmail, setOtpEmail]     = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedVegs, setSelectedVegs] = useState([]);
  const photoRef = useRef();

  const t = lang ? T[lang] : T.en;

  const handleChange = (id, value) => { setForm(f=>({...f,[id]:value})); setErrs(e=>({...e,[id]:''})); };
  const flash = (text, type='error') => { setMsg(text); setMsgType(type); setTimeout(()=>setMsg(''),7000); };
  const switchMode = next => { setMode(next); setForm({}); setErrs({}); setMsg(''); setPhotoPreview(null); setSelectedVegs([]); };
  const toggleVeg = veg => setSelectedVegs(prev => prev.includes(veg) ? prev.filter(v=>v!==veg) : [...prev,veg]);
  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { flash('Photo must be under 3MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleLogin = async e => {
    e.preventDefault();
    const e2 = {};
    if (!form.email?.trim()) e2.email = t.errEmail;
    if (form.email && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) e2.email = t.errEmailFormat || 'Enter a valid email address.';
    if (!form.password) e2.password = t.errPassword;
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.email,password:form.password}) });
      if (res.ok) {
        const user = await res.json();
        sessionStorage.setItem('loggedUser', JSON.stringify({...user, lang}));
        if (user.role==='ADMIN') navigate('/admin');
        else if (user.role==='FARMER') navigate('/farmer');
        else navigate('/customer');
      } else { flash((await res.text()) || t.errPassword); }
    } catch { flash('Cannot reach server. Is the backend running?'); }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault();
    const e2 = {};
    if (!form.role) e2.role = t.errRole;
    if (!form.name?.trim()) e2.name = t.errName;
    if (!form.email?.trim()) e2.email = t.errEmail;
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone)) e2.phone = t.errPhone;
    if (!form.nic || (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic))) e2.nic = t.errNic;
    if (!form.email?.trim() || !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(form.email)) e2.email = t.errEmail;
    if (!form.password || form.password.length < 6) e2.password = t.errPasswordMin;
    if (form.password && !/.*[a-zA-Z].*/.test(form.password)) e2.password = t.errPasswordLetter || 'Password must contain at least one letter.';
    if (form.password && !/.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*/.test(form.password)) e2.password = t.errPasswordSpecial || 'Password must contain at least one special character (e.g. @, #, !).';
    if (form.password !== form.confirmPassword) e2.confirmPassword = t.errPasswordMatch;
    if (form.role === 'FARMER') {
      if (!form.farmLocation) e2.farmLocation = t.errDistrict;
      if (!form.farmSize?.trim()) e2.farmSize = t.errFarmName;
      if (!form.cultivatedAreaHectares || isNaN(form.cultivatedAreaHectares)) e2.cultivatedAreaHectares = t.errArea;
      if (selectedVegs.length === 0) e2.vegetables = t.errVegs;
      if (form.yearsOfExperience !== '' && form.yearsOfExperience !== undefined &&
          (isNaN(form.yearsOfExperience) || parseInt(form.yearsOfExperience) < 0))
        e2.yearsOfExperience = lang==='si' ? 'අත්දැකීම් ඍණ විය නොහැකිය.' : 'Years of experience cannot be negative.';
    }
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const payload = {
        name:form.name, email:form.email, phone:form.phone, nic:form.nic,
        password:form.password, role:form.role,
        deliveryAddress:form.deliveryAddress||null,
        ...(form.role==='FARMER' && {
          farmLocation:form.farmLocation, farmSize:form.farmSize,
          cultivatedAreaHectares:parseFloat(form.cultivatedAreaHectares),
          yearsOfExperience:form.yearsOfExperience ? parseInt(form.yearsOfExperience) : null,
          cultivatedVegetables:selectedVegs.join(', '),
          profilePicture:photoPreview||null,
        }),
      };
      const res = await fetch(`${USER_API}/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      if (res.ok) { flash(form.role==='FARMER' ? t.successFarmer : t.successCustomer, 'success'); switchMode('login'); }
      else { flash(await res.text()); }
    } catch { flash('Network error. Please try again.'); }
    setLoading(false);
  };

  const handleForgot = async e => {
    e.preventDefault();
    if (!form.forgotEmail?.trim()) { setErrs({forgotEmail:t.errEmail}); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:form.forgotEmail}) });
      if (res.ok) { setOtpEmail(form.forgotEmail); setMode('otp'); flash('OTP sent!','success'); }
      else flash(await res.text());
    } catch { flash('Network error.'); }
    setLoading(false);
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    if (!form.otp?.trim()) { setErrs({otp:t.errOtp}); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:otpEmail,otp:form.otp}) });
      if (res.ok) { setMode('reset'); flash('OTP verified.','success'); }
      else flash('Invalid or expired OTP.');
    } catch { flash('Network error.'); }
    setLoading(false);
  };

  const handleReset = async e => {
    e.preventDefault();
    const e2 = {};
    if (!form.newPassword||form.newPassword.length<6) e2.newPassword=t.errNewPassword;
    if (form.newPassword!==form.confirmNewPassword) e2.confirmNewPassword=t.errPasswordMatch;
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:otpEmail,newPassword:form.newPassword}) });
      if (res.ok) { flash(lang==='si'?'මුරපදය යළි සකසා ඇත!':'Password reset! You can now log in.','success'); switchMode('login'); }
      else flash(await res.text());
    } catch { flash('Network error.'); }
    setLoading(false);
  };

  const fp = {form,onChange:handleChange,errs};
  const isFarmerReg = mode==='register' && form.role==='FARMER';
  const vegList = lang==='si' ? SL_VEGETABLES.si : SL_VEGETABLES.en;

  const primaryBtn = (label, disabled) => (
    <button type="submit" disabled={disabled} style={{
      width:'100%', padding:'15px',
      background: disabled ? '#6b9e62' : 'linear-gradient(135deg,#1a3a0a,#4a9e3f)',
      color:'white', border:'none', borderRadius:14, fontWeight:700, fontSize:'1rem',
      cursor: disabled?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif",
      boxShadow: disabled?'none':'0 4px 20px rgba(26,58,10,0.35)',
      transition:'all 0.2s', letterSpacing:'0.2px', marginTop:8,
    }}>{label}</button>
  );

  // ── Wrapper styles ─────────────────────────────────────────────────────
  const bg = (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg,#061403 0%,#1a3a0a 35%,#2d5a1b 70%,#0f4a1a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'24px 16px', fontFamily:"'DM Sans',sans-serif", position:'relative', overflow:'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{position:'absolute',top:-200,right:-200,width:500,height:500,borderRadius:'50%',background:'rgba(74,158,63,0.07)',border:'1px solid rgba(74,158,63,0.1)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-120,left:-120,width:400,height:400,borderRadius:'50%',background:'rgba(212,114,42,0.06)',pointerEvents:'none'}}/>
    </div>
  );

  // ── LOGO component ─────────────────────────────────────────────────────
  const Logo = ({ showTagline=true }) => (
    <div style={{textAlign:'center',marginBottom:showTagline?0:0}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,marginBottom:8}}>
        <div style={{width:54,height:54,background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.22)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
            <path d="M40 8C40 8,68 18,68 42C68 62,54 72,40 74C26 72,12 62,12 42C12 18,40 8,40 8Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
            <path d="M40 8L40 74" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M40 30L56 40M40 30L24 40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:800,color:'white',lineHeight:1}}>
            VegLife <span style={{fontSize:'1.1rem',opacity:0.7}}>LK</span>
          </div>
          {showTagline && <div style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.55)',marginTop:3}}>{lang ? t.tagline : 'ශ්‍රී ලංකාවේ ගොවි-ගෙදර වේදිකාව'}</div>}
        </div>
      </div>
    </div>
  );

  // ── Flash message ──────────────────────────────────────────────────────
  const Flash = () => msg ? (
    <div style={{background:msgType==='success'?'#d4edda':'#fdecea',border:`1px solid ${msgType==='success'?'#b2dfdb':'#f5c6cb'}`,color:msgType==='success'?'#1a5c2a':'#721c24',borderRadius:12,padding:'13px 16px',fontSize:'0.88rem',marginBottom:20,display:'flex',alignItems:'flex-start',gap:10}}>
      <span style={{flexShrink:0}}>{msgType==='success'?'✅':'⚠️'}</span><span>{msg}</span>
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN 1 — LANGUAGE PICKER
  // ═══════════════════════════════════════════════════════════════════════
  if (!lang) {
    return (
      <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#061403 0%,#1a3a0a 35%,#2d5a1b 70%,#0f4a1a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:32,width:'100%',maxWidth:500}}>
          <Logo showTagline={false}/>

          <div style={{background:'white',borderRadius:24,padding:'40px 36px',width:'100%',boxShadow:'0 20px 80px rgba(0,0,0,0.3)',textAlign:'center'}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:800,color:'#1a3a0a',marginBottom:6}}>
              Choose Language · භාෂාව තෝරන්න
            </div>
            <div style={{fontSize:'0.88rem',color:'#8a9e8a',marginBottom:32}}>
              Select your preferred language to continue<br/>
              ඔබගේ භාෂාව තෝරා ඉදිරියට යන්න
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {[
                { code:'en', flag:'🇬🇧', name:'English', native:'English', desc:'Continue in English' },
                { code:'si', flag:'🇱🇰', name:'Sinhala', native:'සිංහල', desc:'සිංහලෙන් ඉදිරිය යන්න' },
              ].map(l => (
                <button key={l.code} onClick={()=>setLang(l.code)} style={{
                  padding:'24px 16px', border:'2px solid #e0f0da', borderRadius:18,
                  background:'white', cursor:'pointer', transition:'all 0.2s',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:10,
                  boxShadow:'0 2px 12px rgba(26,58,10,0.06)',
                }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='#4a9e3f';e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,10,0.15)';}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor='#e0f0da';e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 12px rgba(26,58,10,0.06)';}}>
                  <span style={{fontSize:'2.8rem'}}>{l.flag}</span>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:800,color:'#1a3a0a'}}>{l.native}</div>
                    <div style={{fontSize:'0.78rem',color:'#8a9e8a',marginTop:4}}>{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p style={{color:'rgba(255,255,255,0.3)',fontSize:'0.76rem'}}>VegLife © 2025 · ශ්‍රී ලංකා</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCREENS 2+ — LOGIN / REGISTER / etc.
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#061403 0%,#1a3a0a 35%,#2d5a1b 70%,#0f4a1a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',fontFamily:"'DM Sans',sans-serif",position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-200,right:-200,width:500,height:500,borderRadius:'50%',background:'rgba(74,158,63,0.07)',border:'1px solid rgba(74,158,63,0.1)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-120,left:-120,width:400,height:400,borderRadius:'50%',background:'rgba(212,114,42,0.06)',pointerEvents:'none'}}/>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:24,width:'100%',maxWidth: isFarmerReg ? 900 : 480}}>

        {/* Logo + lang switcher */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
          <Logo showTagline={true}/>
          <button onClick={()=>setLang(null)} style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white',padding:'6px 14px',borderRadius:20,fontSize:'0.78rem',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
            {lang==='en'?'🇬🇧':'🇱🇰'} {lang==='en'?'EN':'SI'}
          </button>
        </div>

        {/* Card */}
        <div style={{background:'white',borderRadius:24,padding:isFarmerReg?'36px 40px':'36px',width:'100%',boxShadow:'0 20px 80px rgba(0,0,0,0.28)'}}>
          <Flash/>

          {/* ── LOGIN ── */}
          {mode==='login' && (
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:800,color:'#1a3a0a',marginBottom:4}}>{t.welcomeBack} 🌿</div>
              <div style={{fontSize:'0.9rem',color:'#8a9e8a',marginBottom:28}}>{t.signInSub}</div>
              <form onSubmit={handleLogin} noValidate>
                <Field label={t.email} id="email" type="email" placeholder={t.emailPh} required {...fp}/>
                <Field label={t.password} id="password" type="password" placeholder={t.passwordPh.split('+')[0].trim()} required {...fp}/>
                <div style={{textAlign:'right',marginBottom:24,marginTop:-4}}>
                  <span onClick={()=>switchMode('forgot')} style={{fontSize:'0.84rem',color:'#2980b9',cursor:'pointer',fontWeight:600}}>{t.forgotPassword}</span>
                </div>
                {primaryBtn(loading ? t.signingIn : t.signIn, loading)}
              </form>
              <div style={{textAlign:'center',marginTop:22,fontSize:'0.9rem',color:'#8a9e8a'}}>
                {t.noAccount}{' '}<span onClick={()=>switchMode('register')} style={{color:'#2d5a1b',fontWeight:700,cursor:'pointer'}}>{t.registerHere}</span>
              </div>
              <div style={{marginTop:24,padding:'14px 16px',background:'linear-gradient(135deg,#f0faf0,#e8f5e9)',borderRadius:14,border:'1px solid #c8e6c9',textAlign:'center'}}>
                <div style={{fontSize:'0.8rem',color:'#2d5a1b',fontWeight:700,marginBottom:3}}>🇱🇰 {lang==='si'?'ශ්‍රී ලාංකික':'Proudly Sri Lankan'}</div>
                <div style={{fontSize:'0.76rem',color:'#6a8a6a'}}>{t.sub}</div>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode==='register' && (
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:800,color:'#1a3a0a',marginBottom:4}}>{t.joinVegLife} 🌱</div>
              <div style={{fontSize:'0.9rem',color:'#8a9e8a',marginBottom:24}}>{t.joinSub}</div>

              {/* Role selector */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>{t.iAmA} *</div>
                {!form.role ? (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {[{key:'FARMER',icon:'👨‍🌾',title:t.farmer,sub:t.farmerSub},{key:'CUSTOMER',icon:'🛒',title:t.customer,sub:t.customerSub}].map(r=>(
                      <button key={r.key} type="button" onClick={()=>handleChange('role',r.key)} style={{padding:'20px 14px',border:'2px solid #e0f0da',borderRadius:16,cursor:'pointer',textAlign:'center',background:'white',transition:'all 0.2s',boxShadow:'0 2px 8px rgba(26,58,10,0.06)'}}
                        onMouseOver={e=>{e.currentTarget.style.borderColor='#4a9e3f';e.currentTarget.style.transform='translateY(-2px)';}}
                        onMouseOut={e=>{e.currentTarget.style.borderColor='#e0f0da';e.currentTarget.style.transform='';}}>
                        <div style={{fontSize:'2rem',marginBottom:8}}>{r.icon}</div>
                        <div style={{fontSize:'0.92rem',fontWeight:700,color:'#1a3a0a'}}>{r.title}</div>
                        <div style={{fontSize:'0.76rem',color:'#8a9e8a',marginTop:4}}>{r.sub}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'#e8f5e9',border:'2px solid #4a9e3f',borderRadius:16}}>
                    <span style={{fontSize:'1.8rem'}}>{form.role==='FARMER'?'👨‍🌾':'🛒'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#2d5a1b'}}>{form.role==='FARMER'?t.farmer:t.customer}</div>
                      <div style={{fontSize:'0.78rem',color:'#6a8a6a'}}>{form.role==='FARMER'?t.farmerSub:t.customerSub}</div>
                    </div>
                    <button type="button" onClick={()=>handleChange('role','')} style={{background:'white',border:'1.5px solid #c8e6c9',borderRadius:10,padding:'6px 14px',fontSize:'0.8rem',fontWeight:700,color:'#2d5a1b',cursor:'pointer'}}>{t.change}</button>
                  </div>
                )}
                {errs.role&&<div style={{fontSize:'0.78rem',color:'#c0392b',marginTop:6}}>⚠ {errs.role}</div>}
              </div>

              <form onSubmit={handleRegister} noValidate>
                {isFarmerReg ? (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 36px'}}>
                    {/* LEFT — Personal */}
                    <div>
                      <div style={{fontSize:'0.72rem',fontWeight:800,color:'#4a9e3f',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:16,paddingBottom:8,borderBottom:'2px solid #e8f5e9'}}>{t.personalInfo}</div>
                      <div style={{marginBottom:18,textAlign:'center'}}>
                        <div onClick={()=>photoRef.current.click()} style={{width:80,height:80,borderRadius:'50%',margin:'0 auto 8px',cursor:'pointer',background:photoPreview?'transparent':'linear-gradient(135deg,#e8f5e9,#c8e6c9)',border:'3px solid #4a9e3f',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(74,158,63,0.2)'}}>
                          {photoPreview?<img src={photoPreview} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<span style={{fontSize:'1.8rem'}}>📷</span>}
                        </div>
                        <div style={{fontSize:'0.74rem',color:'#8a9e8a'}}>{t.profilePhoto}</div>
                        <input ref={photoRef} type="file" accept="image/jpeg,image/png" style={{display:'none'}} onChange={handlePhoto}/>
                      </div>
                      <Field label={t.fullName} id="name" placeholder={t.fullNamePh} required {...fp}/>
                      <Field label={t.email} id="email" type="email" placeholder={t.emailPh} required {...fp}/>
                      <Field label={t.phone} id="phone" placeholder={t.phonePh} maxLength={10} required {...fp}/>
                      <Field label={t.nic} id="nic" placeholder={t.nicPh} required {...fp}/>
                      <Field label={t.passwordLabel} id="password" type="password" placeholder={t.passwordPh} required {...fp}/>
                    {form.password && (
                      <div style={{fontSize:'0.74rem',marginTop:-10,marginBottom:14,padding:'8px 12px',
                        background: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                          ? '#e8f5e9' : '#fff3e0',
                        border:'1px solid',
                        borderColor: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                          ? '#c8e6c9' : '#ffd080',
                        borderRadius:8}}>
                        {[
                          [form.password.length >= 6, lang==='si'?'අවම අක්ෂර 6':'At least 6 characters'],
                          [/[a-zA-Z]/.test(form.password), lang==='si'?'අකුරක් ඇතුළත්':'Contains a letter'],
                          [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), lang==='si'?'විශේෂ අක්ෂරයක් ඇතුළත්':'Contains a special character'],
                        ].map(([ok, label]) => (
                          <div key={label} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                            <span style={{color:ok?'#2d5a1b':'#e67e22',fontWeight:700}}>{ok?'✓':'○'}</span>
                            <span style={{color:ok?'#2d5a1b':'#7d5300'}}>{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                      {form.password && (
                        <div style={{fontSize:'0.74rem',marginTop:-10,marginBottom:14,padding:'8px 12px',
                          background: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                            ? '#e8f5e9' : '#fff3e0',
                          border: '1px solid',
                          borderColor: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                            ? '#c8e6c9' : '#ffd080',
                          borderRadius:8}}>
                          {[
                            [form.password.length >= 6, lang==='si'?'අවම අක්ෂර 6':'At least 6 characters'],
                            [/[a-zA-Z]/.test(form.password), lang==='si'?'අකුරක් ඇතුළත්':'Contains a letter'],
                            [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), lang==='si'?'විශේෂ අක්ෂරයක් ඇතුළත්':'Contains a special character'],
                          ].map(([ok, label]) => (
                            <div key={label} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                              <span style={{color:ok?'#2d5a1b':'#e67e22',fontWeight:700}}>{ok?'✓':'○'}</span>
                              <span style={{color:ok?'#2d5a1b':'#7d5300'}}>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Field label={t.confirmPassword} id="confirmPassword" type="password" placeholder={t.confirmPh} required {...fp}/>
                    </div>

                    {/* RIGHT — Farm */}
                    <div>
                      <div style={{fontSize:'0.72rem',fontWeight:800,color:'#4a9e3f',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:16,paddingBottom:8,borderBottom:'2px solid #e8f5e9'}}>{t.farmInfo}</div>
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>{t.district} *</label>
                        <select value={form.farmLocation||''} onChange={e=>handleChange('farmLocation',e.target.value)} style={{width:'100%',padding:'13px 16px',border:`1.5px solid ${errs.farmLocation?'#c0392b':'#d0e8c8'}`,borderRadius:12,fontSize:'0.95rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',color:form.farmLocation?'#1a2e1a':'#999',cursor:'pointer'}}>
                          <option value="">{t.districtPh}</option>
                          {SL_DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                        {errs.farmLocation&&<div style={{fontSize:'0.78rem',color:'#c0392b',marginTop:5}}>⚠ {errs.farmLocation}</div>}
                      </div>
                      <Field label={t.farmName} id="farmSize" placeholder={t.farmNamePh} required {...fp}/>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                        <div style={{marginBottom:16}}>
                          <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>{t.cultivatedArea} *</label>
                          <input type="number" step="0.1" min="0.1" value={form.cultivatedAreaHectares||''} onChange={e=>handleChange('cultivatedAreaHectares',e.target.value)} placeholder={t.cultivatedPh} style={{width:'100%',padding:'13px 16px',border:`1.5px solid ${errs.cultivatedAreaHectares?'#c0392b':'#d0e8c8'}`,borderRadius:12,fontSize:'0.95rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',color:'#1a2e1a',boxSizing:'border-box'}}/>
                          {errs.cultivatedAreaHectares&&<div style={{fontSize:'0.78rem',color:'#c0392b',marginTop:5}}>⚠ {errs.cultivatedAreaHectares}</div>}
                        </div>
                        <div style={{marginBottom:16}}>
                          <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>{t.experience}</label>
                          <input type="number" min="0" max="60" value={form.yearsOfExperience||''} onChange={e=>{ const v=e.target.value; if(v===''||parseInt(v)>=0) handleChange('yearsOfExperience',v); }} onBlur={e=>{ if(parseInt(e.target.value)<0) handleChange('yearsOfExperience','0'); }} placeholder={t.experiencePh} style={{width:'100%',padding:'13px 16px',border:`1.5px solid ${errs.yearsOfExperience?'#c0392b':'#d0e8c8'}`,borderRadius:12,fontSize:'0.95rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',color:'#1a2e1a',boxSizing:'border-box'}}/>
                        </div>
                      </div>
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>{t.vegetables} *</label>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px 10px'}}>
                          {vegList.map((veg,i)=>{
                            const engVeg = SL_VEGETABLES.en[i];
                            const isSelected = selectedVegs.includes(engVeg);
                            return (
                              <label key={engVeg} onClick={()=>toggleVeg(engVeg)} style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer',padding:'9px 11px',borderRadius:10,background:isSelected?'#e8f5e9':'#fafcfa',border:`1.5px solid ${isSelected?'#4a9e3f':'#d0e8c8'}`,transition:'all 0.15s',userSelect:'none'}}>
                                <div style={{width:18,height:18,borderRadius:5,flexShrink:0,background:isSelected?'#4a9e3f':'white',border:`2px solid ${isSelected?'#4a9e3f':'#c8d8c8'}`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.7rem',fontWeight:800}}>
                                  {isSelected&&'✓'}
                                </div>
                                <span style={{fontSize:'0.86rem',fontWeight:isSelected?700:500,color:isSelected?'#2d5a1b':'#4a5c4a'}}>{veg}</span>
                              </label>
                            );
                          })}
                        </div>
                        {errs.vegetables&&<div style={{fontSize:'0.78rem',color:'#c0392b',marginTop:6}}>⚠ {errs.vegetables}</div>}
                        {selectedVegs.length>0&&<div style={{marginTop:8,fontSize:'0.78rem',color:'#4a9e3f',fontWeight:600}}>{t.vegsSelected(selectedVegs.length)}</div>}
                      </div>
                    </div>
                  </div>
                ) : form.role === 'CUSTOMER' ? (
                  <>
                    <Field label={t.fullName} id="name" placeholder={lang==='si'?'නිමාලී සිල්වා':'Nimali Silva'} required {...fp}/>
                    <Field label={t.email} id="email" type="email" placeholder={t.emailPh} required {...fp}/>
                    <Field label={t.phone} id="phone" placeholder={t.phonePh} maxLength={10} required {...fp}/>
                    <Field label={t.nic} id="nic" placeholder={t.nicPh} required {...fp}/>
                    <Field label={t.passwordLabel} id="password" type="password" placeholder={t.passwordPh} required {...fp}/>
                    {form.password && (
                      <div style={{fontSize:'0.74rem',marginTop:-10,marginBottom:14,padding:'8px 12px',
                        background: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                          ? '#e8f5e9' : '#fff3e0',
                        border:'1px solid',
                        borderColor: form.password.length>=6 && /[a-zA-Z]/.test(form.password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)
                          ? '#c8e6c9' : '#ffd080',
                        borderRadius:8}}>
                        {[
                          [form.password.length >= 6, lang==='si'?'අවම අක්ෂර 6':'At least 6 characters'],
                          [/[a-zA-Z]/.test(form.password), lang==='si'?'අකුරක් ඇතුළත්':'Contains a letter'],
                          [/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password), lang==='si'?'විශේෂ අක්ෂරයක් ඇතුළත්':'Contains a special character'],
                        ].map(([ok, label]) => (
                          <div key={label} style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                            <span style={{color:ok?'#2d5a1b':'#e67e22',fontWeight:700}}>{ok?'✓':'○'}</span>
                            <span style={{color:ok?'#2d5a1b':'#7d5300'}}>{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Field label={t.confirmPassword} id="confirmPassword" type="password" placeholder={t.confirmPh} required {...fp}/>
                    <div style={{marginBottom:16}}>
                      <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:7}}>
                        {lang==='si'?'බෙදා හැරීමේ ලිපිනය':'Delivery Address'}
                      </label>
                      <textarea value={form.deliveryAddress||''} onChange={e=>handleChange('deliveryAddress',e.target.value)}
                        placeholder={lang==='si'?'ඔබගේ නිවසේ ලිපිනය':'e.g. 45/B Peradeniya Road, Kandy'}
                        rows={2} style={{width:'100%',padding:'13px 16px',border:'1.5px solid #d0e8c8',borderRadius:12,
                          fontSize:'0.95rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',
                          color:'#1a2e1a',boxSizing:'border-box',resize:'vertical'}}/>
                    </div>
                  </>
                ) : null}

                {form.role && primaryBtn(loading ? t.creatingAccount : t.createAccount, loading)}
              </form>

              <div style={{textAlign:'center',marginTop:18,fontSize:'0.9rem',color:'#8a9e8a'}}>
                {t.alreadyAccount}{' '}<span onClick={()=>switchMode('login')} style={{color:'#2d5a1b',fontWeight:700,cursor:'pointer'}}>{t.signInLink}</span>
              </div>
            </>
          )}

          {/* ── FORGOT ── */}
          {mode==='forgot' && (
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:800,color:'#1a3a0a',marginBottom:4}}>{t.resetPassword}</div>
              <div style={{fontSize:'0.9rem',color:'#8a9e8a',marginBottom:28}}>{t.resetSub}</div>
              <form onSubmit={handleForgot} noValidate>
                <Field label={t.email} id="forgotEmail" type="email" placeholder={t.emailPh} required {...fp}/>
                {primaryBtn(loading ? t.sending : t.sendOtp, loading)}
              </form>
              <div style={{textAlign:'center',marginTop:18}}>
                <span onClick={()=>switchMode('login')} style={{color:'#2d5a1b',fontWeight:700,cursor:'pointer',fontSize:'0.9rem'}}>{t.backToLogin}</span>
              </div>
            </>
          )}

          {/* ── OTP ── */}
          {mode==='otp' && (
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:800,color:'#1a3a0a',marginBottom:4}}>{t.enterOtp}</div>
              <div style={{fontSize:'0.9rem',color:'#8a9e8a',marginBottom:28}}>{t.otpSub(otpEmail)}<br/><span style={{fontSize:'0.8rem'}}>{t.otpDevNote}</span></div>
              <form onSubmit={handleVerifyOtp} noValidate>
                <Field label={t.otpLabel} id="otp" placeholder={t.otpPh} maxLength={6} required {...fp}/>
                {primaryBtn(loading ? t.verifying : t.verifyOtp, loading)}
              </form>
            </>
          )}

          {/* ── RESET ── */}
          {mode==='reset' && (
            <>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.8rem',fontWeight:800,color:'#1a3a0a',marginBottom:4}}>{t.newPassword}</div>
              <div style={{fontSize:'0.9rem',color:'#8a9e8a',marginBottom:28}}>{t.newPasswordSub}</div>
              <form onSubmit={handleReset} noValidate>
                <Field label={t.newPasswordLabel} id="newPassword" type="password" placeholder={t.passwordPh} required {...fp}/>
                <Field label={t.confirmPassword} id="confirmNewPassword" type="password" placeholder={t.confirmPh} required {...fp}/>
                {primaryBtn(loading ? t.resetting : t.resetBtn, loading)}
              </form>
            </>
          )}
        </div>

        <p style={{color:'rgba(255,255,255,0.3)',fontSize:'0.76rem',letterSpacing:'0.5px'}}>{t.footer}</p>
      </div>
    </div>
  );
}
