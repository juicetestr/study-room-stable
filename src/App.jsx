import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { db } from './firebase';
import { ref, onValue, set, push, update, remove } from 'firebase/database';


import confetti from 'canvas-confetti';

const AVATAR_OPTIONS = ['🧑‍💻', '🧠', '🍆', '🐈‍⬛', '🐼', '🦭', '🚀', '⚡', '☕', '📚', '🎨', '🎮'];

const rowStyleFix = `
  .clickable-row-checked {
    cursor: pointer;
  }
  .clickable-row-checked:hover {
    background-color: rgba(16, 185, 129, 0.05) !important;
  }
`;

function App() {
  const [myId, setMyId] = useState(() => localStorage.getItem('study_user_id') || '');
  const [roomData, setRoomData] = useState({});
  const [historyLogs, setHistoryLogs] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [compiledExams, setCompiledExams] = useState([]);
  const [activeTableTab, setActiveTableTab] = useState('');
  
  const [examNameInput, setExamNameInput] = useState('');
  const [examDateInput, setExamDateInput] = useState('');
  const [examGradeInput, setExamGradeInput] = useState('');
  
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧑‍💻');
  
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newDeadlineNote, setNewDeadlineNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  
  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [editingDlTitle, setEditingDlTitle] = useState('');
  const [editingDlNote, setEditingDlNote] = useState('');
  const [expandedDeadlines, setExpandedDeadlines] = useState({});
  
  // State for inline exam editing
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingExamName, setEditingExamName] = useState('');
  const [editingExamDate, setEditingExamDate] = useState('');
  const [editingExamGrade, setEditingExamGrade] = useState('');

  const [p1Elapsed, setP1Elapsed] = useState(0);
  const [p2Elapsed, setP2Elapsed] = useState(0);

  const [showPlannedExams, setShowPlannedExams] = useState(false);

  const examsWithDates = compiledExams.filter(e => e.date);
  const totalExamsCount = examsWithDates.length;
  const passedExamsCount = examsWithDates.filter(e => e.passed).length;
  const progressPercentage = totalExamsCount > 0 ? Math.round((passedExamsCount / totalExamsCount) * 100) : 0;

  useEffect(() => {
    const roomRef = ref(db, 'study_room/');
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(data);
      } else {
        set(roomRef, {
          user_1: { name: 'Alex', avatar: '🧑‍💻', isStudying: false, startTime: 0, note: '', totalTime: 0 },
          user_2: { name: 'Sam', avatar: '🧠', isStudying: false, startTime: 0, note: '', totalTime: 0 }
        });
      }
    });
    return () => unsubscribeRoom();
  }, []);


  useEffect(() => {
    let unsubscribeExams = () => {};
    if (activeTableTab) {
      const examsRef = ref(db, `study_exams/${activeTableTab}`);      
      unsubscribeExams = onValue(examsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const examsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
          });
          setCompiledExams(examsArray);
        } else {
          setCompiledExams([]);
        }
      });
    }
    return () => unsubscribeExams();
  }, [activeTableTab]);

  useEffect(() => {
    const historyRef = ref(db, 'study_history/');
    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).reverse();
        setHistoryLogs(logsArray);
      } else {
        setHistoryLogs([]);
      }
    });
    return () => unsubscribeHistory();
  }, []);

  useEffect(() => {
    const deadlinesRef = ref(db, 'study_deadlines/');
    const unsubscribeDeadlines = onValue(deadlinesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const deadlinesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        setDeadlines(deadlinesArray);
      } else {
        setDeadlines([]);
      }
    });
    return () => unsubscribeDeadlines();
  }, []);

  useEffect(() => {
    if (myId && roomData[myId]) {
      setCustomName(roomData[myId].name || '');
      setSelectedAvatar(roomData[myId].avatar || '🧑‍💻');
      setActiveTableTab(myId); 
    }
  }, [myId, roomData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const u1 = roomData.user_1;
      const u2 = roomData.user_2;
      if (u1?.isStudying && u1?.startTime) setP1Elapsed(Math.floor((Date.now() - u1.startTime) / 1000));
      else setP1Elapsed(0);
      if (u2?.isStudying && u2?.startTime) setP2Elapsed(Math.floor((Date.now() - u2.startTime) / 1000));
      else setP2Elapsed(0);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomData]);

  const p1 = roomData.user_1 || { name: 'Alex', avatar: '🧑‍💻', isStudying: false, totalTime: 0 };
  const p2 = roomData.user_2 || { name: 'Sam', avatar: '🧠', isStudying: false, totalTime: 0 };
  const me = myId === 'user_1' ? p1 : p2;

const handleLogin = (userId) => {
  setMyId(userId); 

  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted!');
      }
    });
  }
};

  const handleLogout = () => {
    localStorage.removeItem('study_user_id');
    setMyId('');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!customName.trim() || !myId) return;
    const meRef = ref(db, `study_room/${myId}`);
    update(meRef, { name: customName.trim(), avatar: selectedAvatar });
    setIsEditingProfile(false);
  };

  const handleEncouragePartner = () => {
    if (!myId) return;
    
    const partnerId = myId === 'user_1' ? 'user_2' : 'user_1';
    const partnerRef = ref(db, `study_room/${partnerId}`);

    const customMessage = currentNote.trim() ? currentNote.trim() : "default";

    update(partnerRef, { nudgeReceived: customMessage })
      .then(() => {
        setCurrentNote('');
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Hai mandato un incoraggiamento!🚀',
          showConfirmButton: false,
          timer: 1500,
          background: '#1e293b',
          color: '#fff'
        });
      })
      .catch((err) => console.error("Nudge failed:", err));
  };

  const handleClockToggle = (userId, isCurrentlyStudying) => {
    const newStatus = !isCurrentlyStudying;
    const updates = {};
    
    updates[`study_room/${userId}/isStudying`] = newStatus;
    updates[`study_room/${userId}/note`] = newStatus ? currentNote || "Concentrazione..." : "";
    
    if (newStatus) {
      const now = Date.now();
      updates[`study_room/${userId}/lastLockedInAt`] = now;
      updates[`study_room/${userId}/startTime`] = now;
      
      update(ref(db), updates)
        .then(() => console.log(`✅ Locked In! database status is now: ${newStatus}`))
        .catch((error) => console.error("❌ Firebase write failed: ", error));
    } else {
      const currentStartTime = roomData[userId]?.startTime;
      const currentTotalTime = roomData[userId]?.totalTime || 0;
      const currentUserName = roomData[userId]?.name || (userId === 'user_1' ? 'Alex' : 'Sam');
      
      let sessionSeconds = 0;
      if (currentStartTime) {
        sessionSeconds = Math.floor((Date.now() - currentStartTime) / 1000);
      }

      const newTotalTime = currentTotalTime + sessionSeconds;
      updates[`study_room/${userId}/startTime`] = null;
      updates[`study_room/${userId}/totalTime`] = newTotalTime;

      update(ref(db), updates)
        .then(() => {
          console.log(`✅ Locked Out! Cumulative time updated.`);
          
          if (sessionSeconds > 0) {
            const historyRef = ref(db, 'study_history/');
            const newLogRef = push(historyRef);
            
            set(newLogRef, {
              userId: userId,
              userName: currentUserName,
              duration: formatTime(sessionSeconds),
              note: currentNote || "Concentrazione...",
              timestamp: Date.now()
            })
            .then(() => console.log("✅ History log successfully saved!"))
            .catch((err) => console.error("❌ Failed to save log entry:", err));
          }
        })
        .catch((error) => console.error("❌ Firebase write failed: ", error));
    }
  };

useEffect(() => {
  if (!myId) return;

  const partnerId = myId === 'user_1' ? 'user_2' : 'user_1';
  const myRef = ref(db, `study_room/${myId}`);
  const partnerRef = ref(db, `study_room/${partnerId}`);
  
  let isInitialLoad = true;

  // 1. WATCH FOR INCOMING NUDGES
  const unsubscribeNudge = onValue(myRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Only fire if nudgeReceived is a valid string/message
    if (data.nudgeReceived && data.nudgeReceived !== false && Notification.permission === 'granted') {
      
      let finalMessage = "";
      const currentPartnerName = data.name === 'Alex' ? 'Sam' : 'Alex'; // Fallback logic tracker

      if (data.nudgeReceived === "default") {
        const phrases = [
          "Pensa di essere uno scriba del 1600!!!",
          "Pensa a Leon ce la puoi fare!",
          "Non mollare proprio adesso!",
          "Il caffè sta facendo effetto? Muoviti! ☕"
        ];
        finalMessage = phrases[Math.floor(Math.random() * phrases.length)];
      } else {
        finalMessage = data.nudgeReceived;
      }

      new Notification(`💪 Qualcuno ti sta incoraggiando!`, {
        body: finalMessage
      });

      // Wipe it from Firebase immediately
      update(myRef, { nudgeReceived: false });
    }
  });

  // 2. WATCH FOR LOCK IN ALERTS (Strictly tracks status switch transitions)
  let lastKnownStatus = false;

  const unsubscribePartner = onValue(partnerRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (isInitialLoad) {
      lastKnownStatus = !!data.isStudying;
      isInitialLoad = false;
      return;
    }

    // ONLY trigger if the status actually flipped from FALSE to TRUE right now
    if (data.isStudying && !lastKnownStatus && Notification.permission === 'granted') {
      const partnerName = data.name || 'Il tuo partner';
      new Notification(`🚀 ${partnerName} è locked in!!!!`, {
        body: 'È ora di mettersi a studiare sul serio!',
      });
    }

    // Track the status for the next data update
    lastKnownStatus = !!data.isStudying;
  });

  return () => {
    unsubscribeNudge();
    unsubscribePartner();
  };
}, [myId]); // 👈 CRITICAL: ONLY rebuild if your User ID changes. Never on timer ticks!

useEffect(() => {
  if (myId && 'Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted!');
      }
    });
  }
}, [myId]);

  const handleUpdateLiveNote = () => {
    if (!myId || !me.isStudying) return;
    const meRef = ref(db, `study_room/${myId}`); // Removed /users/ pathing here too!
    update(meRef, { note: currentNote.trim() || 'Concentrazione...' });
  };

  const startEditingLog = (log) => {
    setEditingLogId(log.id);
    setEditingText(log.note);
  };

  const saveLogEdit = (logId) => {
    if (!editingText.trim()) return;
    const logRef = ref(db, `study_history/${logId}`);
    update(logRef, { note: editingText.trim() });
    setEditingLogId(null);
  };

  const deleteLog = (log) => {
    Swal.fire({
      title: '', 
      html: `
        <div class="flex flex-col items-center justify-center text-center font-sans">
          <div class="text-5xl mb-4 animate-bounce">⚠️</div>
          <h2 class="text-xl font-black text-slate-100 tracking-wide mb-1.5">Eliminare questa sessione?</h2>
          <p class="text-xs text-slate-400 max-w-[260px] leading-relaxed">
            Verranno sottratti <span class="text-amber-400 font-mono font-bold">${log.duration}</span> dal tempo totale di <span class="text-indigo-300 font-bold">${log.userName}</span>.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sì, elimina',
      cancelButtonText: 'Annulla ✕',
      confirmButtonColor: '#C2270A', 
      cancelButtonColor: '#475569',   
      background: '#1e293b',          
      customClass: {
        popup: '!rounded-3xl !border-2 !border-amber-500/20 !shadow-2xl !p-6',
        actions: '!mt-6 !gap-3',
        confirmButton: '!rounded-xl !px-6 !py-2.5 !font-bold !text-sm shadow-md transition-all hover:scale-105 active:scale-95',
        cancelButton: '!rounded-xl !px-6 !py-2.5 !font-bold !text-sm shadow-md transition-all hover:scale-105 active:scale-95'
      },
      buttonsStyling: true
    }).then((result) => {
      if (result.isConfirmed) {
        const timeParts = log.duration.split(':');
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        const seconds = parseInt(timeParts[2], 10) || 0;
        const totalLogSeconds = (hours * 3600) + (minutes * 60) + seconds;
        const targetUserKey = log.userId;
        const currentTotalTime = roomData[targetUserKey]?.totalTime || 0;
        const userRef = ref(db, `study_room/${targetUserKey}`);
        update(userRef, { totalTime: Math.max(0, currentTotalTime - totalLogSeconds) });
        remove(ref(db, `study_history/${log.id}`));
      }
    });
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newDeadlineTitle.trim() || !newDeadlineDate) return;
    const deadlinesRef = ref(db, 'study_deadlines/');
    const newRef = push(deadlinesRef);
    set(newRef, {
      title: newDeadlineTitle.trim(),
      date: newDeadlineDate,
      note: showNoteInput ? newDeadlineNote.trim() : '',
      createdBy: me.name
    });
    setNewDeadlineTitle('');
    setNewDeadlineDate('');
    setNewDeadlineNote('');
    setShowNoteInput(false);
  };

  const startEditingDeadline = (dl) => {
    setEditingDeadlineId(dl.id);
    setEditingDlTitle(dl.title);
    setEditingDlNote(dl.note || '');
  };

  const saveDeadlineEdit = (dlId) => {
    if (!editingDlTitle.trim()) return;
    const dlRef = ref(db, `study_deadlines/${dlId}`);
    update(dlRef, { title: editingDlTitle.trim(), note: editingDlNote.trim() });
    setEditingDeadlineId(null);
  };

  const deleteDeadline = (dlId) => {
    Swal.fire({
      title: '', 
      html: `
        <div class="flex flex-col items-center justify-center text-center font-sans">
          <div class="text-5xl mb-4 animate-bounce">⚠️</div>
          <h2 class="text-xl font-black text-slate-100 tracking-wide mb-1.5">Eliminare questo esame?</h2>
          <p class="text-xs text-slate-400 max-w-[240px] leading-relaxed">Sei sicuro? Questa azione cancellerà definitivamente i dati.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sì, elimina',
      cancelButtonText: 'Annulla ✕',
      confirmButtonColor: '#C2270A', 
      cancelButtonColor: '#475569',   
      background: '#1e293b',          
      customClass: {
        popup: '!rounded-3xl !border-2 !border-amber-500/20 !shadow-2xl !p-6',
        actions: '!mt-6 !gap-3',
        confirmButton: '!rounded-xl !px-6 !py-2.5 !font-bold !text-sm shadow-md transition-all hover:scale-105 active:scale-95',
        cancelButton: '!rounded-xl !px-6 !py-2.5 !font-bold !text-sm shadow-md transition-all hover:scale-105 active:scale-95'
      },
      buttonsStyling: true
    }).then((result) => {
      if (result.isConfirmed) remove(ref(db, `study_deadlines/${dlId}`));
    });
  };

  const toggleExpandDeadline = (id) => {
    setExpandedDeadlines(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDaysLeft = (targetDate) => {
    const [year, month, day] = targetDate.split('-').map(Number);
    const examDate = new Date(year, month - 1, day); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Oggi! 🚨";
    if (diffDays === 1) return "Domani! ⚠️";
    if (diffDays < 0) return "Passato";
    return `${diffDays} giorni rimasti`;
  };

  useEffect(() => {
  // Set up an interval that runs every second
  const timerInterval = setInterval(() => {
    
    // 1. Calculate elapsed time for Player 1
    if (p1 && p1.isStudying && p1.startTime) {
      // Calculate how many seconds have passed since they hit 'Lock In'
      const secondsPassed = Math.floor((Date.now() - p1.startTime) / 1000);
      setP1Elapsed(secondsPassed);
    } else if (p1 && !p1.isStudying) {
      setP1Elapsed(0); // Reset timer if logged out
    }

    // 2. Calculate elapsed time for Player 2
    if (p2 && p2.isStudying && p2.startTime) {
      const secondsPassed = Math.floor((Date.now() - p2.startTime) / 1000);
      setP2Elapsed(secondsPassed);
    } else if (p2 && !p2.isStudying) {
      setP2Elapsed(0); // Reset timer if logged out
    }

  }, 1000);

  // Clean up the interval loop whenever the component unmounts
  return () => clearInterval(timerInterval);
}, [p1, p2]); // Re-runs whenever p1 or p2 state changes from Firebase

  const handleAddExamRow = (e) => {
    e.preventDefault();
    if (activeTableTab !== myId) return; 
    if (!examNameInput.trim() || !myId) return;
    const userExamsRef = ref(db, `study_exams/${myId}`);
    const newExamRef = push(userExamsRef); 
    set(newExamRef, { 
      name: examNameInput.trim(), 
      date: examDateInput || '', 
      grade: examGradeInput.trim() || '', 
      passed: false 
    }).then(() => { 
      setExamNameInput(''); 
      setExamDateInput(''); 
      setExamGradeInput(''); 
    });
  };

  const toggleExamPassed = (examId, currentStatus) => {
    if (activeTableTab !== myId) return; 
    const examRef = ref(db, `study_exams/${myId}/${examId}`);
    update(examRef, { passed: !currentStatus });
  };

  const startEditingExam = (exam) => {
    setEditingExamId(exam.id);
    setEditingExamName(exam.name);
    setEditingExamDate(exam.date || '');
    setEditingExamGrade(exam.grade || '');
  };

  const saveExamEdit = (examId) => {
    if (!editingExamName.trim()) return;
    const examRef = ref(db, `study_exams/${myId}/${examId}`);
    update(examRef, {
      name: editingExamName.trim(),
      date: editingExamDate,
      grade: editingExamGrade.trim()
    });
    setEditingExamId(null);
  };

  const deleteExamRow = (examId) => {
    if (activeTableTab !== myId) return; 
    remove(ref(db, `study_exams/${myId}/${examId}`));
  };

  if (!myId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center border border-slate-700 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">👋 Chi sta studiando?</h1>
            <p className="text-xs text-slate-400">Seleziona il profilo ed entra in aula</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => handleLogin('user_1')} className="py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm cursor-pointer">Enter as {p1.name}</button>
            <button onClick={() => handleLogin('user_2')} className="py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-sm cursor-pointer">Enter as {p2.name}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 gap-6 relative overflow-x-hidden">
      <style>{rowStyleFix}</style>
      
      <div className="w-full max-w-4xl flex justify-between items-center px-4 mb-2">
        <button onClick={() => setIsDiaryOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
          📜 Registro ({historyLogs.length})
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer">
            ⚙️ Modifica profilo
          </button>
          <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-rose-400 underline cursor-pointer">
            Log out ({me.name})
          </button>
        </div>
        <button onClick={() => setIsCalendarOpen(true)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
          📅 Esami ({deadlines.length})
        </button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-center">✨ Aula Studio ✨</h1>
      
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-700 relative">
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="absolute inset-0 bg-slate-800 rounded-2xl p-6 flex flex-col z-10 text-left">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-4">
              <h3 className="font-bold text-base">⚙️ Personalizza il profilo</h3>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome</label>
            <input type="text" required maxLength={15} value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-white mb-4 focus:outline-none focus:border-indigo-500" />
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cosa ti senti?</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {AVATAR_OPTIONS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setSelectedAvatar(emoji)} className={`py-2 text-xl rounded-xl border transition-all ${selectedAvatar === emoji ? 'bg-indigo-600/30 border-indigo-500 scale-105' : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-900'}`}>{emoji}</button>
              ))}
            </div>
            <button type="submit" className="w-full mt-auto py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all cursor-pointer">Salva modifiche</button>
          </form>
        )}

        <div className="flex justify-center gap-12 mb-8 items-end pt-16">
          <div className="flex flex-col items-center w-28 relative">
            {p1.isStudying && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold animate-bounce shadow-md w-28 z-0 text-center">
                <div className="font-black">{formatTime(p1Elapsed)}</div>
                <div className="text-[10px] opacity-80 truncate italic">"{p1.note}"</div>
              </div>
            )}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 transition-all duration-300 ${p1.isStudying ? 'border-green-400 bg-green-950 scale-110 shadow-lg' : 'border-slate-600 bg-slate-700'}`}>{p1.avatar || '🧑‍💻'}</div>
            <span className="text-sm mt-2 font-semibold text-slate-300 truncate w-full text-center">{p1.name}</span>
            {myId === 'user_1' && <span className="text-xs text-indigo-400 font-medium text-center">(Tu)</span>}
          </div>

          <div className="flex flex-col items-center w-28 relative">
            {p2.isStudying && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold animate-bounce shadow-md w-28 z-0 text-center">
                <div className="font-black">{formatTime(p2Elapsed)}</div>
                <div className="text-[10px] opacity-80 truncate italic">"{p2.note}"</div>
              </div>
            )}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-4 transition-all duration-300 ${p2.isStudying ? 'border-cyan-400 bg-cyan-950 scale-110 shadow-lg' : 'border-slate-600 bg-slate-700'}`}>{p2.avatar || '🧠'}</div>
            <span className="text-sm mt-2 font-semibold text-slate-300 truncate w-full text-center">{p2.name}</span>
            {myId === 'user_2' && <span className="text-xs text-indigo-400 font-medium text-center">(Tu)</span>}
          </div>
        </div>

        {/* Encourage Button - Only shows if your partner is currently working! */}
        {((myId === 'user_1' && p2.isStudying) || (myId === 'user_2' && p1.isStudying)) && (
          <button
            onClick={handleEncouragePartner}
            className="w-full mb-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md animate-pulse"
          >
            ⚡ Invia Carica! ⚡
          </button>
        )}

        <div className="mb-4 flex flex-col gap-2">
          <input type="text" value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Cosa stai studiando?" className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-center focus:outline-none focus:border-indigo-500 text-white" />
          {me.isStudying && (
            <button onClick={handleUpdateLiveNote} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer self-center">🔄 Aggiorna la nuvoletta</button>
          )}
        </div>
        <button 
          onClick={() => handleClockToggle(myId, me?.isStudying || false)} 
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all cursor-pointer ${me?.isStudying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
        >
          {me?.isStudying ? 'Lock Out 🛑' : 'Lock In 🚀'}
        </button>

        </div>

      <div className="w-full max-w-md bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">🏆 Chi ha sprecato più tempo? (All-Time)</h2>    {/* DO NOT UNDER ANY CIRCUMSTANCE CHANGE OR MODIFY OR REMOVE THIS LINE */} 
        <div className="space-y-2">
          <div className="flex justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm">
            <span>{p1.name}</span>
            <span className="font-mono font-bold text-indigo-400">{formatTime(p1.totalTime)}</span>
          </div>
          <div className="flex justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm">
            <span>{p2.name}</span>
            <span className="font-mono font-bold text-indigo-400">{formatTime(p2.totalTime)}</span>
          </div>
        </div>
      </div>

      {/* PERSONAL EXAM DASHBOARD TABLE */}
      <div className="w-full max-w-4xl bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mt-4">

          {/* Progress Bar Counter */}
          {/* Progress Bar Counter */}
          {(() => {
            const totalExamsCount = compiledExams ? compiledExams.length : 0;
            const passedExamsCount = compiledExams ? compiledExams.filter(e => e.passed).length : 0;
            const progressPercentage = totalExamsCount > 0 ? Math.round((passedExamsCount / totalExamsCount) * 100) : 0;

            // Fire confetti ONLY if you hit 100% AND have completed at least 10 exams
            if (totalExamsCount > 0 && progressPercentage === 100 && passedExamsCount >= 10) {
              // Wrapped in a tiny timeout so it doesn't block the React render cycle
              setTimeout(() => {
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b']
                });
              }, 150);
            }

            if (totalExamsCount === 0) return null;

            return (
              <div className="mb-5 bg-slate-900/50 border border-slate-700/40 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1.5 text-xs font-bold tracking-wide">
                  <span className="text-slate-400 uppercase">Completamento Totale Libretto</span>
                  <span className="text-indigo-400 font-mono text-sm">
                    {progressPercentage === 100 && passedExamsCount >= 10 
                      ? '🎉 100% COMPLETATO! 🎉' 
                      : `${progressPercentage}% (${passedExamsCount}/${totalExamsCount})`}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/60">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      progressPercentage === 100 && passedExamsCount >= 10
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                        : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            );
          })()}

        <div className="flex gap-2 mb-4 border-b border-slate-700 pb-3">
          {Object.keys(roomData).map((userKey) => (
            <button
              key={userKey}
              type="button"
              onClick={() => { setActiveTableTab(userKey); setEditingExamId(null); }}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTableTab === userKey ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              🎓 Libretto {roomData[userKey]?.name}
            </button>
          ))}
        </div>

        {activeTableTab === myId ? (
          <form onSubmit={handleAddExamRow} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6">
            <input type="text" required placeholder="Esame (obbligatorio)" value={examNameInput} onChange={(e) => setExamNameInput(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
            <input type="date" value={examDateInput} onChange={(e) => setExamDateInput(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none uppercase font-mono" />
            <input type="text" placeholder="Voto (es. 30L)" value={examGradeInput} onChange={(e) => setExamGradeInput(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 font-bold text-xs py-2 rounded-lg transition-all cursor-pointer">Aggiungi esame ➕</button>
          </form>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl mb-6 text-center text-xs text-slate-400 italic">👀 Stai guardando il libretto di {roomData[activeTableTab]?.name}.</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-2 w-24 text-center">Stato</th>
                <th className="py-3 px-3">Esame</th>
                <th className="py-3 px-3">Data Superamento</th>
                <th className="py-3 px-3">Voto</th>
                {activeTableTab === myId && <th className="py-3 px-2 text-center w-24">Azioni</th>}
              </tr>
            </thead>
            <tbody>
            {compiledExams.length === 0 ? (
              <tr>
                <td colSpan={activeTableTab === myId ? "5" : "4"} className="py-8 text-center italic text-slate-500">Nessun esame registrato in questo libretto.</td>
              </tr>
            ) : (
              <>
                {/* 1. EXAMS WITH DATES (Always Visible - Passed or Scheduled) */}
                {compiledExams.filter(e => e.date).map((exam) => (
                  <tr 
                    key={exam.id} 
                    onClick={() => {
                      if (exam.passed && activeTableTab === myId && editingExamId !== exam.id) {
                        toggleExamPassed(exam.id, exam.passed);
                      }
                    }}
                    className={`border-b border-slate-800/60 transition-colors ${
                      exam.passed 
                        ? 'bg-slate-900/20 text-slate-200 clickable-row-checked' 
                        : 'hover:bg-slate-700/30 text-slate-200'
                    }`}
                    title={exam.passed && activeTableTab === myId ? "Clicca sulla riga per ripristinare lo stato dell'esame" : ""}
                  >
                    <td className="py-3 px-2 text-center h-9" onClick={(e) => e.stopPropagation()}>
                      {exam.passed ? (
                        <div 
                          onClick={() => activeTableTab === myId && toggleExamPassed(exam.id, exam.passed)} 
                          className={`w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center mx-auto text-[10px] text-slate-950 font-bold ${activeTableTab === myId ? 'cursor-pointer' : ''}`}
                        >
                          ✓
                        </div>
                      ) : (
                        <input 
                          type="checkbox" 
                          checked={exam.passed} 
                          disabled={activeTableTab !== myId} 
                          onChange={() => toggleExamPassed(exam.id, exam.passed)}
                          className={`w-4 h-4 accent-emerald-500 rounded ${activeTableTab === myId ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {editingExamId === exam.id ? (
                        <input type="text" value={editingExamName} onChange={(e) => setEditingExamName(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-full focus:outline-none" onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <span className="font-semibold">{exam.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {editingExamId === exam.id ? (
                        <input type="date" value={editingExamDate} onChange={(e) => setEditingExamDate(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white uppercase font-mono focus:outline-none" onClick={(e) => e.stopPropagation()} />
                      ) : (
                        new Date(exam.date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {editingExamId === exam.id ? (
                        <input type="text" value={editingExamGrade} onChange={(e) => setEditingExamGrade(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-20 focus:outline-none" onClick={(e) => e.stopPropagation()} />
                      ) : (
                        exam.grade ? (
                          <span className="font-bold font-mono text-white">{exam.grade}</span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )
                      )}
                    </td>
                    {activeTableTab === myId && (
                      <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        {editingExamId === exam.id ? (
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => setEditingExamId(null)} className="text-slate-400 hover:text-white underline font-semibold">Annulla</button>
                            <button type="button" onClick={() => saveExamEdit(exam.id)} className="text-green-400 hover:text-green-300 font-bold underline">Salva</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingExam(exam)} className="text-indigo-400 hover:text-indigo-300 underline">Modifica</button>
                            <button type="button" onClick={() => deleteExamRow(exam.id)} className="text-slate-500 hover:text-rose-400 transition-colors">✕</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}

                {/* 2. DROPDOWN TOGGLE ROW FOR NO-DATE EXAMS */}
                {compiledExams.filter(e => !e.date).length > 0 && (
                  <tr 
                    onClick={() => setShowPlannedExams(!showPlannedExams)} 
                    className="bg-slate-900/60 hover:bg-slate-900 cursor-pointer select-none border-b border-slate-800"
                  >
                    <td colSpan={activeTableTab === myId ? "5" : "4"} className="py-3 px-4 text-left font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                      <span className="inline-block w-4 transform transition-transform duration-200 text-center mr-1">
                        {showPlannedExams ? '▼' : '▶'}
                      </span>
                      Esami da fare ({compiledExams.filter(e => !e.date).length})
                    </td>
                  </tr>
                )}

                {/* 3. NO-DATE EXAMS LIST (Conditionally Displayed) */}
                {showPlannedExams && compiledExams.filter(e => !e.date).map((exam) => (
                  <tr 
                    key={exam.id} 
                    className="border-b border-slate-800/40 bg-slate-900/10 hover:bg-slate-700/20 text-slate-300 transition-colors"
                  >
                    <td className="py-3 px-2 text-center h-9">
                      <input 
                        type="checkbox" 
                        checked={exam.passed} 
                        disabled={activeTableTab !== myId} 
                        onChange={() => toggleExamPassed(exam.id, exam.passed)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3">
                      {editingExamId === exam.id ? (
                        <input type="text" value={editingExamName} onChange={(e) => setEditingExamName(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-full focus:outline-none" />
                      ) : (
                        <span className="font-medium text-slate-400">{exam.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 italic">
                      {editingExamId === exam.id ? (
                        <input type="date" value={editingExamDate} onChange={(e) => setEditingExamDate(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white uppercase font-mono focus:outline-none" />
                      ) : (
                        "Da definire"
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {editingExamId === exam.id ? (
                        <input type="text" value={editingExamGrade} onChange={(e) => setEditingExamGrade(e.target.value)} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white w-20 focus:outline-none" />
                      ) : (
                        <span className="font-mono">{exam.grade || '-'}</span>
                      )}
                    </td>
                    {activeTableTab === myId && (
                      <td className="py-3 px-2 text-center">
                        {editingExamId === exam.id ? (
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => setEditingExamId(null)} className="text-slate-400 hover:text-white underline font-semibold">Annulla</button>
                            <button type="button" onClick={() => saveExamEdit(exam.id)} className="text-green-400 hover:text-green-300 font-bold underline">Salva</button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => startEditingExam(exam)} className="text-indigo-400 hover:text-indigo-300 underline">Modifica</button>
                            <button type="button" onClick={() => deleteExamRow(exam.id)} className="text-slate-500 hover:text-rose-400 transition-colors">✕</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* PANEL 1: GLOBAL DIARY */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col p-6 ${isDiaryOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold">📖 Registro</h2>
          <button onClick={() => { setIsDiaryOpen(false); setEditingLogId(null); }} className="text-slate-500 hover:text-white text-xl font-bold cursor-pointer">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {historyLogs.map((log) => (
            <div key={log.id} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${log.userId === 'user_1' ? 'bg-indigo-950/80 text-indigo-300' : 'bg-cyan-950/80 text-cyan-300'}`}>{log.userName}</span>
                <span className="text-slate-500">{log.date}</span>
              </div>
              {editingLogId === log.id ? (
                <div className="flex flex-col gap-2 mt-1">
                  <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none" />
                  <div className="flex justify-end gap-3 text-xs pt-1">
                    <button onClick={() => setEditingLogId(null)} className="text-slate-400 underline cursor-pointer">Annulla</button>
                    <button onClick={() => saveLogEdit(log.id)} className="text-green-400 font-bold underline cursor-pointer">Salva</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-200 break-words font-medium leading-relaxed">"{log.note}"</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/40">
                    <div className="flex gap-3 text-xs text-slate-500">
                      <button onClick={() => startEditingLog(log)} className="hover:text-indigo-400 underline cursor-pointer transition-colors">Modifica</button>
                      <button onClick={() => deleteLog(log)} className="hover:text-rose-400 underline cursor-pointer transition-colors">Elimina</button>
                    </div>
                    <div className="text-xs text-green-400 font-mono font-bold bg-green-950/40 border border-green-900/30 px-2 py-0.5 rounded">⏱ {log.duration}</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PANEL 2: DEADLINES CALENDAR */}
          <div className={`fixed top-0 right-0 bottom-0 w-80 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col p-6 ${isCalendarOpen ? 'translate-x-0' : 'translate-x-full'}`}>        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold">📅 Esami e scadenze</h2>
          <button onClick={() => { setIsCalendarOpen(false); setEditingDeadlineId(null); }} className="text-slate-500 hover:text-white text-xl font-bold cursor-pointer">✕</button>
        </div>
        <form onSubmit={handleAddDeadline} className="mb-6 bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggiungi</h3>
          <input type="text" required placeholder="Che devi fare?" value={newDeadlineTitle} onChange={(e) => setNewDeadlineTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500" />
          <input type="date" required value={newDeadlineDate} onChange={(e) => setNewDeadlineDate(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none uppercase font-mono" />
          <button type="button" onClick={() => setShowNoteInput(!showNoteInput)} className="text-left text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer self-start">{showNoteInput ? '✕ Annulla' : '＋ Aggiungi descrizione'}</button>
          {showNoteInput && <textarea placeholder="Dettagli..." value={newDeadlineNote} onChange={(e) => setNewDeadlineNote(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white resize-none focus:outline-none focus:border-indigo-500" />}
          <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md">Aggiungi 📌</button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {deadlines.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center mt-10">Niente da fare!</p>
          ) : (
            deadlines.map((dl) => (
              <div key={dl.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 relative shadow-sm">
                {editingDeadlineId === dl.id ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modifica</label>
                    <input type="text" value={editingDlTitle} onChange={(e) => setEditingDlTitle(e.target.value)} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white focus:outline-none" />
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modifica descrizione</label>
                    <textarea value={editingDlNote} onChange={(e) => setEditingDlNote(e.target.value)} rows={2} className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white resize-none focus:outline-none" />
                    <div className="flex justify-end gap-3 text-xs pt-1">
                      <button onClick={() => setEditingDeadlineId(null)} className="text-slate-400 underline cursor-pointer">Annulla</button>
                      <button onClick={() => saveDeadlineEdit(dl.id)} className="text-green-400 font-bold underline cursor-pointer">Salva modifiche</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-bold text-slate-100 break-words leading-snug">{dl.title}</span>
                    <span className="text-[11px] text-slate-500 italic">Aggiunto da {dl.createdBy}</span>
                    {dl.note && (
                      <div className="mt-0.5">
                        <button onClick={() => toggleExpandDeadline(dl.id)} className="text-[11px] text-slate-400 hover:text-slate-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors">{expandedDeadlines[dl.id] ? '📖 Nascondi info' : '📘 Vedi descrizione'}</button>
                        {expandedDeadlines[dl.id] && <p className="mt-1.5 text-xs text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-words font-medium leading-relaxed">{dl.note}</p>}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-800/60 pt-2.5">
                      <span className="font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/30 px-2 py-0.5 rounded font-medium">{new Date(dl.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span className={`font-semibold ${getDaysLeft(dl.date).includes('🚨') || getDaysLeft(dl.date).includes('⚠️') ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-400'}`}>{getDaysLeft(dl.date)}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1 border-t border-slate-800/40 pt-2">
                      <button onClick={() => startEditingDeadline(dl)} className="hover:text-indigo-400 underline cursor-pointer transition-colors">Modifica</button>
                      <button onClick={() => deleteDeadline(dl.id)} className="hover:text-rose-400 underline cursor-pointer transition-colors">Elimina</button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {(isDiaryOpen || isCalendarOpen) && (
        <div onClick={() => { setIsDiaryOpen(false); setIsCalendarOpen(false); setEditingLogId(null); setEditingDeadlineId(null); setEditingExamId(null); }} className="fixed inset-0 bg-black/60 z-40" />
      )}
    </div>
  );
}

export default App;