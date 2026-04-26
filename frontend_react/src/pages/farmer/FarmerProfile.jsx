import React, { useState } from 'react';
import '../../Css/profile.css';

const SL_VEGETABLES = [
  'Cabbage','Beans','Tomato','Cauliflower','Potato',
  'Okra','Brinjal','Green Chilli','Onion','Carrot',
];

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo',
  'Galle','Gampaha','Hambantota','Jaffna','Kalutara',
  'Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const Profile = () => {
  const _raw = JSON.parse(sessionStorage.getItem('loggedUser') || '{}');

  const [farmer, setFarmer] = useState({
    farmerId:              _raw.farmerId || _raw.farmerIndex || '—',
    fullName:              _raw.name || 'Farmer',
    phone:                 _raw.phone || '—',
    email:                 _raw.email || '—',
    district:              _raw.farmLocation || '—',
    farmName:              _raw.farmSize || '—',
    cultivatedAreaHectares: _raw.cultivatedAreaHectares || null,
    yearsOfExperience:     _raw.yearsOfExperience || null,
    cultivatedVegetables:  _raw.cultivatedVegetables || '',
    profilePicture:        _raw.profilePicture || null,
    status:                _raw.status || 'active',
  });

  const [editOpen, setEditOpen]   = useState(false);
  const [editForm, setEditForm]   = useState({});
  const [selectedVegs, setSelectedVegs] = useState([]);
  const [picPreview, setPicPreview]     = useState(null);
  const [saving, setSaving]             = useState(false);
  const [alert, setAlert]               = useState(null);
  const photoRef = React.useRef();

  const showAlert = (msg, type='success') => {
    setAlert({msg,type});
    setTimeout(()=>setAlert(null), 5000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loggedUser');
    window.location.href = '/';
  };

  const openEdit = () => {
    setEditForm({
      name:                    farmer.fullName,
      phone:                   farmer.phone === '—' ? '' : farmer.phone,
      nic:                     _raw.nic || '',
      farmLocation:            farmer.district === '—' ? '' : farmer.district,
      farmSize:                farmer.farmName === '—' ? '' : farmer.farmName,
      cultivatedAreaHectares:  farmer.cultivatedAreaHectares || '',
      yearsOfExperience:       farmer.yearsOfExperience || '',
      deliveryAddress:         _raw.deliveryAddress || '',
    });
    setPicPreview(farmer.profilePicture);
    const vegs = farmer.cultivatedVegetables
      ? farmer.cultivatedVegetables.split(',').map(v=>v.trim()).filter(Boolean)
      : [];
    setSelectedVegs(vegs);
    setEditOpen(true);
    window.dispatchEvent(new CustomEvent('farmer-edit-profile'));
  };

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { showAlert('Photo must be under 3MB.','error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleVeg = veg => setSelectedVegs(prev =>
    prev.includes(veg) ? prev.filter(v=>v!==veg) : [...prev, veg]
  );

  const saveEdit = async () => {
    // Full validation before saving
    if (!editForm.name?.trim()) { showAlert('Full name is required.','error'); return; }
    if (!editForm.phone || !/^[0-9]{10}$/.test(editForm.phone)) {
      showAlert('Phone number must be exactly 10 digits (e.g. 0771234567).','error'); return;
    }
    if (editForm.nic && !/^[0-9]{9}[VvXx]$/.test(editForm.nic) && !/^[0-9]{12}$/.test(editForm.nic)) {
      showAlert('NIC must be 9 digits + V/X (e.g. 123456789V) or 12 digits.','error'); return;
    }
    if (!editForm.farmLocation) { showAlert('District is required.','error'); return; }
    if (!editForm.farmSize?.trim()) { showAlert('Farm name is required.','error'); return; }
    if (editForm.cultivatedAreaHectares && (isNaN(editForm.cultivatedAreaHectares) || parseFloat(editForm.cultivatedAreaHectares) <= 0)) {
      showAlert('Cultivated area must be a number greater than 0.','error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        cultivatedVegetables: selectedVegs.join(', '),
        profilePicture: picPreview || farmer.profilePicture || null,
        cultivatedAreaHectares: editForm.cultivatedAreaHectares ? parseFloat(editForm.cultivatedAreaHectares) : null,
        yearsOfExperience: editForm.yearsOfExperience ? parseInt(editForm.yearsOfExperience) : null,
        nic: editForm.nic || _raw.nic,
      };
      const res = await fetch(`/api/users/${_raw.id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        const newUser = {..._raw, ...updated};
        sessionStorage.setItem('loggedUser', JSON.stringify(newUser));
        setFarmer({
          farmerId:              newUser.farmerId || newUser.farmerIndex || '—',
          fullName:              newUser.name,
          phone:                 newUser.phone || '—',
          email:                 newUser.email,
          district:              newUser.farmLocation || '—',
          farmName:              newUser.farmSize || '—',
          cultivatedAreaHectares: newUser.cultivatedAreaHectares || null,
          yearsOfExperience:     newUser.yearsOfExperience || null,
          cultivatedVegetables:  newUser.cultivatedVegetables || '',
          profilePicture:        newUser.profilePicture || null,
          status:                newUser.status,
        });
        setEditOpen(false);
        showAlert('✅ Profile updated! Admin has been notified of your changes.','success');
      } else {
        showAlert(await res.text(),'error');
      }
    } catch { showAlert('Network error. Please try again.','error'); }
    setSaving(false);
  };

  const vegList = farmer.cultivatedVegetables
    ? farmer.cultivatedVegetables.split(',').map(v=>v.trim()).filter(Boolean)
    : [];

  return (
    <main className="profile-page">

      {alert && (
        <div style={{position:'fixed',top:80,right:24,zIndex:500,
          background:alert.type==='success'?'#2d5a1b':'#c0392b',
          color:'white',padding:'14px 20px',borderRadius:12,
          boxShadow:'0 8px 28px rgba(0,0,0,0.2)',fontSize:'0.88rem',fontWeight:600,
          maxWidth:360,animation:'fadeIn 0.3s ease',display:'flex',alignItems:'center',gap:10}}>
          <span>{alert.msg}</span>
          <span style={{cursor:'pointer',opacity:0.7,marginLeft:'auto'}} onClick={()=>setAlert(null)}>✕</span>
        </div>
      )}

      {/* Profile card */}
      <section className="profile-card">
        <header className="profile-header">
          <div className="profile-header-top">
            <h1>Farmer Profile</h1>
            <button type="button" className="profile-btn profile-btn-logout" onClick={handleLogout}>
              <svg className="profile-btn-icon" viewBox="0 0 24 24"><path d="M16 17l5-5-5-5v3H9v4h7v3z" fill="currentColor"/><path d="M4 4h8v2H6v12h6v2H4z" fill="currentColor"/></svg>
              Log Out
            </button>
          </div>
          <p>Manage your farm profile and account details</p>
        </header>

        {/* Avatar + name hero */}
        <div style={{display:'flex',alignItems:'center',gap:22,padding:'24px 32px',borderBottom:'1px solid #e8f5e9'}}>
          <div style={{width:80,height:80,borderRadius:'50%',border:'3px solid #4a9e3f',overflow:'hidden',flexShrink:0,background:'linear-gradient(135deg,#e8f5e9,#c8e6c9)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(74,158,63,0.2)'}}>
            {farmer.profilePicture
              ? <img src={farmer.profilePicture} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
              : <span style={{fontSize:'2rem',fontWeight:700,color:'#2d5a1b'}}>{farmer.fullName.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem',fontWeight:800,color:'#1a3a0a'}}>{farmer.fullName}</div>
            <div style={{fontSize:'0.84rem',color:'#8a9e8a',marginTop:3}}>{farmer.email}</div>
            <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
              <span style={{background:'linear-gradient(135deg,#1a3a0a,#2d5a1b)',color:'white',fontSize:'0.72rem',fontWeight:700,padding:'3px 12px',borderRadius:20,letterSpacing:'0.5px'}}>
                🌾 {farmer.farmerId}
              </span>
              <span style={{background:farmer.status==='active'?'#e8f5e9':'#fff3cd',color:farmer.status==='active'?'#2d5a1b':'#856404',fontSize:'0.72rem',fontWeight:700,padding:'3px 12px',borderRadius:20,border:`1px solid ${farmer.status==='active'?'#c8e6c9':'#ffc107'}`}}>
                {farmer.status==='active'?'✅ Active':'⏳ Pending Approval'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-item"><span>Phone</span><strong>{farmer.phone}</strong></div>
          <div className="profile-item"><span>NIC</span><strong>{_raw.nic||'—'}</strong></div>
          <div className="profile-item"><span>District</span><strong>{farmer.district}</strong></div>
          <div className="profile-item"><span>Farm Name</span><strong>{farmer.farmName}</strong></div>
          <div className="profile-item"><span>Cultivated Area</span><strong>{farmer.cultivatedAreaHectares ? `${farmer.cultivatedAreaHectares} hectares` : '—'}</strong></div>
          <div className="profile-item"><span>Years of Experience</span><strong>{farmer.yearsOfExperience ? `${farmer.yearsOfExperience} years` : '—'}</strong></div>
        </div>

        {/* Vegetables */}
        {vegList.length > 0 && (
          <div style={{padding:'18px 32px',borderTop:'1px solid #f0f5f0'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,color:'#8a9e8a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>Cultivated Vegetables</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {vegList.map(v=>(
                <span key={v} style={{background:'#e8f5e9',color:'#2d5a1b',border:'1px solid #c8e6c9',borderRadius:20,padding:'5px 14px',fontSize:'0.82rem',fontWeight:600}}>
                  🥬 {v}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="profile-actions">
          <button type="button" className="profile-btn profile-btn-secondary" onClick={openEdit}>✏️ Edit Profile</button>
          <button type="button" className="profile-btn profile-btn-primary" onClick={()=>window.dispatchEvent(new CustomEvent('farmer-nav',{detail:'addstock'}))}>➕ Add New Stock</button>
        </div>
      </section>

      {/* Edit Modal */}
      {editOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',padding:'20px'}}>
          <div style={{background:'white',borderRadius:20,padding:'32px',width:'100%',maxWidth:680,maxHeight:'92vh',overflowY:'auto',boxShadow:'0 20px 80px rgba(0,0,0,0.25)',animation:'scaleIn 0.2s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,paddingBottom:16,borderBottom:'2px solid #e8f5e9'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',color:'#1a3a0a',fontWeight:800}}>✏️ Edit Profile</div>
              <button onClick={()=>setEditOpen(false)} style={{background:'#f0f0f0',border:'none',borderRadius:'50%',width:34,height:34,fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* Notice */}
            <div style={{background:'#fffde7',border:'1px solid #ffc107',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:'0.84rem',color:'#7d5300',display:'flex',gap:10}}>
              <span>⚠️</span>
              <span>Any changes you make will be flagged for admin review. Your profile remains active during the review.</span>
            </div>

            {/* Photo */}
            <div style={{textAlign:'center',marginBottom:20}}>
              <div onClick={()=>photoRef.current.click()} style={{width:80,height:80,borderRadius:'50%',margin:'0 auto 8px',cursor:'pointer',background:picPreview?'transparent':'linear-gradient(135deg,#e8f5e9,#c8e6c9)',border:'3px solid #4a9e3f',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {picPreview?<img src={picPreview} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<span style={{fontSize:'1.8rem'}}>📷</span>}
              </div>
              <div style={{fontSize:'0.74rem',color:'#8a9e8a'}}>Click to change photo</div>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png" style={{display:'none'}} onChange={handlePhoto}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 24px'}}>
              {/* LEFT */}
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:800,color:'#4a9e3f',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12,paddingBottom:6,borderBottom:'2px solid #e8f5e9'}}>👤 Personal</div>
                {[['Full Name','name','text','Kamal Perera',null],['Phone Number','phone','tel','0771234567',10],['NIC Number','nic','text','123456789V or 12 digits',null]].map(([l,id,t,ph,maxLen])=>(
                  <div key={id} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{l}</label>
                    <input type={t} value={editForm[id]||''} onChange={e=>setEditForm(f=>({...f,[id]:e.target.value}))} placeholder={ph}
                      style={{width:'100%',padding:'10px 13px',border:'1.5px solid #d0e8c8',borderRadius:10,fontSize:'0.9rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
              {/* RIGHT */}
              <div>
                <div style={{fontSize:'0.72rem',fontWeight:800,color:'#4a9e3f',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:12,paddingBottom:6,borderBottom:'2px solid #e8f5e9'}}>🌾 Farm Details</div>
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>District</label>
                  <select value={editForm.farmLocation||''} onChange={e=>setEditForm(f=>({...f,farmLocation:e.target.value}))} style={{width:'100%',padding:'10px 13px',border:'1.5px solid #d0e8c8',borderRadius:10,fontSize:'0.9rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',cursor:'pointer'}}>
                    <option value="">Select district...</option>
                    {SL_DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {[['Farm Name / Village','farmSize','text','Green Valley Farm'],['Cultivated Area (ha)','cultivatedAreaHectares','number','2.5'],['Years of Experience','yearsOfExperience','number','10']].map(([l,id,t,ph])=>(
                  <div key={id} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>{l}</label>
                    <input type={t} value={editForm[id]||''} onChange={e=>setEditForm(f=>({...f,[id]:e.target.value}))} placeholder={ph} step={t==='number'?'0.1':undefined}
                      style={{width:'100%',padding:'10px 13px',border:'1.5px solid #d0e8c8',borderRadius:10,fontSize:'0.9rem',fontFamily:"'DM Sans',sans-serif",background:'#fafcfa',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Vegetables */}
            <div style={{marginTop:4,marginBottom:20}}>
              <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'#4a5c4a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>Cultivated Vegetables</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px 10px'}}>
                {SL_VEGETABLES.map(veg=>(
                  <label key={veg} onClick={()=>toggleVeg(veg)} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'7px 9px',borderRadius:8,background:selectedVegs.includes(veg)?'#e8f5e9':'#fafcfa',border:`1.5px solid ${selectedVegs.includes(veg)?'#4a9e3f':'#d0e8c8'}`,transition:'all 0.15s',userSelect:'none'}}>
                    <div style={{width:16,height:16,borderRadius:4,flexShrink:0,background:selectedVegs.includes(veg)?'#4a9e3f':'white',border:`2px solid ${selectedVegs.includes(veg)?'#4a9e3f':'#c8d8c8'}`,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.65rem',fontWeight:800}}>
                      {selectedVegs.includes(veg)&&'✓'}
                    </div>
                    <span style={{fontSize:'0.8rem',fontWeight:selectedVegs.includes(veg)?700:500,color:selectedVegs.includes(veg)?'#2d5a1b':'#4a5c4a'}}>{veg}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid #e8f5e9'}}>
              <button onClick={()=>setEditOpen(false)} style={{padding:'11px 24px',borderRadius:10,border:'1.5px solid #d0e8c8',background:'white',color:'#4a5c4a',fontSize:'0.88rem',fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} style={{padding:'11px 28px',borderRadius:10,background:'linear-gradient(135deg,#2d5a1b,#4a9e3f)',color:'white',border:'none',fontSize:'0.88rem',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",opacity:saving?0.7:1}}>
                {saving?'Saving…':'✅ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
