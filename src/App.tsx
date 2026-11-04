import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  LogOut,
  LogIn,
  User as UserIcon,
  Video,
  MessageSquare,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  ExternalLink,
  Trash2,
  Users,
  CheckCircle2,
  Calculator,
  Atom,
  FlaskConical,
  Languages,
  BookOpen,
  Code,
  Dna,
  Compass,
  Star,
  Info,
  CalendarCheck,
  Copy,
  Search,
} from 'lucide-react';
import { Subject, SubjectId, User, StudySession, ChatMessage } from './types';
import {
  INITIAL_SUBJECTS,
  INITIAL_USERS,
  INITIAL_SESSIONS,
  INITIAL_CHAT_MESSAGES,
} from './mockData';

// Utility to check if a session is in the past
export function checkIsPast(dateStr: string, timeStr: string): boolean {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const sessionDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    return sessionDateTime.getTime() < Date.now();
  } catch {
    return false;
  }
}

// Format date into Vietnamese text
export function formatVietnameseDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayOfWeek = days[d.getDay()];
      return `${dayOfWeek}, ${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export default function App() {
  // LocalStorage state management
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('hate_study_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hate_study_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default: Minh Anh
  });

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem('hate_study_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('hate_study_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('hate_study_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('hate_study_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('hate_study_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('hate_study_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hate_study_chats', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Subject Selection for Bottom Section
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('toan');

  // Modals
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showCreateSessionModal, setShowCreateSessionModal] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [activeChatSession, setActiveChatSession] = useState<StudySession | null>(null);
  const [showMeetPreviewModal, setShowMeetPreviewModal] = useState<boolean>(false);
  const [activeMeetSession, setActiveMeetSession] = useState<StudySession | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Auth form states
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [registerName, setRegisterName] = useState<string>('');
  const [registerUsername, setRegisterUsername] = useState<string>('');
  const [registerGrade, setRegisterGrade] = useState<string>('Lớp 12A1');
  const [registerBio, setRegisterBio] = useState<string>('');

  // New session form state
  const [newSubjectId, setNewSubjectId] = useState<SubjectId>('toan');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newTime, setNewTime] = useState<string>('19:30');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newMeetingUrl, setNewMeetingUrl] = useState<string>('https://meet.google.com/' + Math.random().toString(36).substring(2, 5) + '-' + Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 5));
  const [newNotes, setNewNotes] = useState<string>('');

  // Quick Chat message input
  const [quickMessageText, setQuickMessageText] = useState<string>('');

  // Filter personal sessions for current user
  const userBookedSessions = useMemo(() => {
    if (!currentUser) return [];
    return sessions
      .filter((s) => s.attendeeIds.includes(currentUser.id) || s.creatorId === currentUser.id)
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
        return timeA - timeB;
      });
  }, [sessions, currentUser]);

  // Categorize personal sessions
  const { upcomingPersonalSessions, pastPersonalSessions } = useMemo(() => {
    const upcoming: StudySession[] = [];
    const past: StudySession[] = [];
    userBookedSessions.forEach((s) => {
      if (checkIsPast(s.date, s.time)) {
        past.push(s);
      } else {
        upcoming.push(s);
      }
    });
    return { upcomingPersonalSessions: upcoming, pastPersonalSessions: past };
  }, [userBookedSessions]);

  // Selected date filtered sessions for middle calendar
  const filteredPersonalSessionsByDate = useMemo(() => {
    if (!selectedCalendarDate) return userBookedSessions;
    return userBookedSessions.filter((s) => s.date === selectedCalendarDate);
  }, [userBookedSessions, selectedCalendarDate]);

  // Sessions for the bottom subject board
  const subjectSessions = useMemo(() => {
    return sessions
      .filter((s) => s.subjectId === selectedSubjectId)
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
        return timeA - timeB;
      });
  }, [sessions, selectedSubjectId]);

  // Calendar matrix computation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0, Sunday is 6
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentCalendarDate]);

  // Map of date string to session status for current user
  const userDateStatusMap = useMemo(() => {
    const map: Record<string, { hasUpcoming: boolean; hasPast: boolean; count: number }> = {};
    userBookedSessions.forEach((s) => {
      if (!map[s.date]) {
        map[s.date] = { hasUpcoming: false, hasPast: false, count: 0 };
      }
      map[s.date].count += 1;
      const isPast = checkIsPast(s.date, s.time);
      if (isPast) {
        map[s.date].hasPast = true;
      } else {
        map[s.date].hasUpcoming = true;
      }
    });
    return map;
  }, [userBookedSessions]);

  // Handlers for Calendar Navigation
  const prevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedCalendarDate(todayStr);
  };

  // Auth actions
  const handleLogin = (usernameToLogin?: string) => {
    const target = usernameToLogin || loginUsername.trim().toLowerCase();
    if (!target) {
      showToast('Vui lòng nhập tên đăng nhập');
      return;
    }
    const found = users.find((u) => u.username.toLowerCase() === target.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setShowAuthModal(false);
      setLoginUsername('');
      showToast(`Chào mừng bạn quay lại, ${found.name}! Lịch học đã được cập nhật.`);
    } else {
      showToast('Không tìm thấy tài khoản. Bạn có thể nhấn Đăng ký bên cạnh.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerUsername.trim()) {
      showToast('Vui lòng điền đủ Tên và Tên đăng nhập');
      return;
    }
    const exists = users.some((u) => u.username.toLowerCase() === registerUsername.trim().toLowerCase());
    if (exists) {
      showToast('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.');
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: registerName.trim(),
      username: registerUsername.trim().toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(registerName.trim())}&backgroundColor=e0f2fe`,
      grade: registerGrade.trim() || 'Học sinh',
      bio: registerBio.trim() || 'Học sinh chăm chỉ cùng Hate Study!',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setShowAuthModal(false);
    setRegisterName('');
    setRegisterUsername('');
    setRegisterBio('');
    showToast(`Đăng ký thành công! Xin chào ${newUser.name}.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Đã đăng xuất tài khoản.');
  };

  // Toggle joining / leaving a session
  const handleToggleJoinSession = (session: StudySession) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('Vui lòng đăng nhập để lưu lịch học vào tài khoản của bạn.');
      return;
    }

    const isAttending = session.attendeeIds.includes(currentUser.id);
    let updatedAttendees: string[];
    let updatedNames: string[];

    if (isAttending) {
      updatedAttendees = session.attendeeIds.filter((id) => id !== currentUser.id);
      updatedNames = (session.attendeeNames || []).filter((n) => n !== currentUser.name);
      showToast(`Đã hủy tham gia lịch môn ${session.subjectName}.`);
    } else {
      updatedAttendees = [...session.attendeeIds, currentUser.id];
      updatedNames = [...(session.attendeeNames || []), currentUser.name];
      showToast(`Đã thêm buổi học "${session.title}" vào Lịch cá nhân của bạn! ⭐`);
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === session.id
          ? {
              ...s,
              attendeeIds: updatedAttendees,
              attendeeNames: updatedNames,
            }
          : s
      )
    );
  };

  // Handle creating a new study-together slot
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!newTitle.trim()) {
      showToast('Vui lòng nhập chủ đề / nội dung cần học cùng.');
      return;
    }

    const subjectObj = INITIAL_SUBJECTS.find((s) => s.id === newSubjectId);
    const newSessionItem: StudySession = {
      id: `sess_${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorAvatar: currentUser.avatar,
      creatorGrade: currentUser.grade,
      subjectId: newSubjectId,
      subjectName: subjectObj ? subjectObj.name : 'Môn học',
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      durationMinutes: Number(newDuration),
      meetingUrl: newMeetingUrl.trim() || `https://meet.google.com/hate-${Math.random().toString(36).substring(2, 6)}`,
      meetingPlatform: 'Google Meet',
      notes: newNotes.trim(),
      attendeeIds: [currentUser.id],
      attendeeNames: [currentUser.name],
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSessionItem, ...prev]);
    setShowCreateSessionModal(false);
    setNewTitle('');
    setNewNotes('');
    showToast(`Đã đăng lịch hẹn học cùng môn ${newSessionItem.subjectName}! Lịch đã thêm vào trang cá nhân của bạn.`);
  };

  // Generate Google Meet Link helper
  const generateNewMeetLink = () => {
    const code1 = Math.random().toString(36).substring(2, 5);
    const code2 = Math.random().toString(36).substring(2, 6);
    const code3 = Math.random().toString(36).substring(2, 5);
    setNewMeetingUrl(`https://meet.google.com/${code1}-${code2}-${code3}`);
    showToast('Đã tạo liên kết Google Meet mới!');
  };

  // Chat message sending
  const handleSendMessage = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (!activeChatSession || !quickMessageText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sessionId: activeChatSession.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      recipientId: activeChatSession.creatorId,
      recipientName: activeChatSession.creatorName,
      text: quickMessageText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setQuickMessageText('');
    showToast('Đã gửi tin nhắn đến bạn học!');
  };

  // Helper to render icon for subject
  const renderSubjectIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className={className} />;
      case 'Atom':
        return <Atom className={className} />;
      case 'FlaskConical':
        return <FlaskConical className={className} />;
      case 'Languages':
        return <Languages className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Dna':
        return <Dna className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  // Current active subject data
  const currentSubjectObj = INITIAL_SUBJECTS.find((s) => s.id === selectedSubjectId) || INITIAL_SUBJECTS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 transition-all animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TRÊN CÙNG: Thanh điều hướng (Top Navigation)                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 via-sky-50 to-amber-100 border border-sky-200 flex items-center justify-center shadow-xs">
              <span className="font-extrabold text-sky-800 text-lg">HS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-heading">
                  Hate Study
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/60">
                  Miễn phí
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Ghét học một mình · Cùng nhau hoàn thành mục tiêu
              </p>
            </div>
          </div>

          {/* Quick Stats or Current User Zone */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Account Chip */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-sky-50/70 border border-sky-100">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full bg-white border border-sky-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {currentUser.grade}
                    </p>
                  </div>
                </div>

                {/* Switch sample student button */}
                <div className="hidden lg:flex items-center bg-slate-100 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 px-2 font-medium">Đổi tài khoản:</span>
                  {INITIAL_USERS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        showToast(`Đã chuyển sang tài khoản của ${u.name}`);
                      }}
                      className={`px-2 py-1 rounded transition-colors ${
                        currentUser.id === u.id
                          ? 'bg-white font-semibold text-sky-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Đăng nhập nhanh: ${u.name}`}
                    >
                      {u.name.split(' ').slice(-1)[0]}
                    </button>
                  ))}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
                  title="Đăng xuất khỏi tài khoản"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-sky-600" />
                  <span>Đăng nhập</span>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-lg border border-amber-300 transition-colors shadow-xs"
                >
                  <span>Đăng ký</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 flex-1 w-full">
        {/* Banner Welcome & Star Rules Legend */}
        <section className="bg-gradient-to-r from-sky-50 via-white to-amber-50/60 rounded-2xl p-5 border border-sky-100/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                Xin chào{currentUser ? `, ${currentUser.name}` : ''}!
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Lịch học thông minh tự động cập nhật theo tài khoản của bạn. Đặt hẹn học nhóm cùng bạn bè khắp mọi nơi.
              </p>
            </div>

            {/* Quy tắc đánh dấu ngôi sao trực quan theo yêu cầu */}
            <div className="flex flex-wrap items-center gap-3 bg-white/90 px-4 py-2.5 rounded-xl border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-700">Quy tắc đánh dấu:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-md bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-600" />
                </span>
                <span className="text-slate-700 font-medium">Ngôi sao Vàng pastel: Hôm nay & tương lai</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-md bg-sky-100/90 border border-sky-200 flex items-center justify-center text-sky-500 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-sky-200 text-sky-600" />
                </span>
                <span className="text-slate-700 font-medium">Ngôi sao Xanh nhạt: Lịch đã qua (quá khứ)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. Ở GIỮA: Lịch cá nhân (Personal Schedule & Calendar)                     */}
        {/* ========================================================================= */}
        <section id="personal-schedule" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-sky-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Lịch cá nhân của bạn
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {currentUser
                  ? `Hiển thị riêng cho tài khoản ${currentUser.name} (${userBookedSessions.length} buổi học đã lưu)`
                  : 'Vui lòng đăng nhập để xem lịch cá nhân của bạn.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedCalendarDate && (
                <button
                  onClick={() => setSelectedCalendarDate(null)}
                  className="px-3 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xem tất cả ngày</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowAuthModal(true);
                    return;
                  }
                  setShowCreateSessionModal(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-xl border border-amber-300 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Đặt lịch mới</span>
              </button>
            </div>
          </div>

          {!currentUser ? (
            <div className="bg-white rounded-2xl border border-dashed border-sky-200 p-12 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600 mb-4">
                <CalendarIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Bạn chưa đăng nhập</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Mỗi học sinh có lịch học riêng biệt. Đăng nhập hoặc chọn 1 tài khoản mẫu để trải nghiệm ngay!
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors"
                >
                  Đăng nhập ngay
                </button>
                <button
                  onClick={() => handleLogin('minhanh')}
                  className="px-4 py-2 text-xs font-semibold text-slate-800 bg-amber-100 hover:bg-amber-200 rounded-xl border border-amber-200 transition-colors"
                >
                  Thử nhanh với Minh Anh (12A1)
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Cột trái: Giao diện Lịch Tháng Trực Quan (Interactive Month Calendar) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-sky-100 p-5 shadow-xs">
                {/* Month navigation bar */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Tháng {currentCalendarDate.getMonth() + 1}, {currentCalendarDate.getFullYear()}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nhấn vào ngày để lọc các buổi học
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={goToToday}
                      className="px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                  <span>CN</span>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {calendarDays.map((cell, idx) => {
                    const status = userDateStatusMap[cell.dateStr];
                    const isSelected = selectedCalendarDate === cell.dateStr;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCalendarDate(isSelected ? null : cell.dateStr)}
                        className={`min-h-[52px] p-1 rounded-xl flex flex-col items-center justify-between transition-all relative border ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/90 font-bold text-sky-900 shadow-xs'
                            : cell.isToday
                            ? 'border-amber-300 bg-amber-50/50 text-slate-900 font-semibold'
                            : cell.isCurrentMonth
                            ? 'border-transparent hover:bg-slate-50 text-slate-700'
                            : 'border-transparent text-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                            cell.isToday
                              ? 'bg-amber-300 text-slate-900 font-bold'
                              : isSelected
                              ? 'bg-sky-600 text-white'
                              : ''
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* HIỂN THỊ NGÔI SAO TRÊN BẢNG LỊCH:
                            - Giờ đặt hẹn trong ngày hôm nay hoặc tương lai -> Ngôi sao Vàng pastel
                            - Lịch hẹn đã qua thời gian (quá khứ) -> Ngôi sao Xanh dương nhạt pastel */}
                        <div className="flex items-center justify-center gap-0.5 mt-0.5">
                          {status?.hasUpcoming && (
                            <span
                              title="Có lịch hẹn hôm nay / tương lai (Ngôi sao Vàng pastel)"
                              className="text-amber-500 flex items-center justify-center"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-500 stroke-[1.5]" />
                            </span>
                          )}
                          {status?.hasPast && (
                            <span
                              title="Có lịch hẹn đã qua trong quá khứ (Ngôi sao Xanh pastel)"
                              className="text-sky-500 flex items-center justify-center"
                            >
                              <Star className="w-3.5 h-3.5 fill-sky-200 text-sky-500 stroke-[1.5]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Calendar Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-500" /> Sắp tới
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-sky-200 text-sky-500" /> Đã qua
                    </span>
                  </div>
                  <span>{userBookedSessions.length} buổi tổng cộng</span>
                </div>
              </div>

              {/* Cột phải: Danh sách chi tiết các lớp học & thời gian đã đặt hẹn */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {selectedCalendarDate ? (
                      <span>
                        Lớp học ngày: {formatVietnameseDate(selectedCalendarDate)}
                      </span>
                    ) : (
                      <span>Tất cả lịch học đã đặt hẹn ({userBookedSessions.length})</span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Sắp xếp theo thời gian
                  </div>
                </div>

                {filteredPersonalSessionsByDate.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                    <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      {selectedCalendarDate
                        ? 'Không có lịch học nào trong ngày đã chọn.'
                        : 'Bạn chưa có lịch học nào trong tài khoản.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Hãy chọn một môn học ở danh sách bên dưới và nhấn "Học cùng nhau" để lưu lịch vào tài khoản!
                    </p>
                    <a
                      href="#subject-section"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Xem các môn học bên dưới</span>
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPersonalSessionsByDate.map((session) => {
                      const isPast = checkIsPast(session.date, session.time);
                      const isCreator = session.creatorId === currentUser.id;

                      return (
                        <div
                          key={session.id}
                          className={`rounded-2xl p-4 transition-all border ${
                            isPast
                              ? 'bg-sky-50/40 border-sky-100 hover:border-sky-200'
                              : 'bg-white border-amber-100/90 hover:border-amber-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* CỤ THỂ HÓA HÌNH NGÔI SAO:
                                  Hôm nay hoặc tương lai -> Ngôi sao VÀNG pastel
                                  Đã qua thời gian (quá khứ) -> Ngôi sao XANH DƯƠNG nhạt pastel */}
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isPast
                                    ? 'bg-sky-100/80 border-sky-200 text-sky-600'
                                    : 'bg-amber-100/90 border-amber-200 text-amber-600 shadow-xs'
                                }`}
                                title={
                                  isPast
                                    ? 'Lịch hẹn đã qua thời gian (Ngôi sao Xanh dương nhạt pastel)'
                                    : 'Lịch hẹn hôm nay / tương lai (Ngôi sao Vàng pastel)'
                                }
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    isPast
                                      ? 'fill-sky-200 text-sky-500'
                                      : 'fill-amber-300 text-amber-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-sky-800 bg-sky-100/70 px-2.5 py-0.5 rounded-md border border-sky-200/60">
                                    {session.subjectName}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {session.time} ({session.durationMinutes} phút)
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatVietnameseDate(session.date)}
                                  </span>
                                  {isCreator && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                      Bạn đã tạo
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                                  {session.title}
                                </h4>

                                {session.notes && (
                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                    {session.notes}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={session.creatorAvatar}
                                      alt={session.creatorName}
                                      className="w-4 h-4 rounded-full"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span>Tạo bởi: {session.creatorName}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{session.attendeeIds.length} học sinh tham gia</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status tag */}
                            <div>
                              {isPast ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-100/90 px-2 py-1 rounded-lg border border-sky-200">
                                  <Check className="w-3 h-3 text-sky-600" />
                                  Đã kết thúc
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100/90 px-2 py-1 rounded-lg border border-amber-200">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  Sắp diễn ra
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Action buttons for Personal Session */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Open Online Meeting */}
                              <button
                                onClick={() => {
                                  setActiveMeetSession(session);
                                  setShowMeetPreviewModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-100/90 hover:bg-sky-200 rounded-lg transition-colors flex items-center gap-1.5 border border-sky-200"
                              >
                                <Video className="w-3.5 h-3.5 text-sky-600" />
                                <span>Phòng {session.meetingPlatform}</span>
                              </button>

                              {/* Chat with host/attendees */}
                              <button
                                onClick={() => {
                                  setActiveChatSession(session);
                                  setShowChatModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                <span>Nhắn tin nhóm</span>
                              </button>
                            </div>

                            {/* Remove from personal schedule */}
                            <button
                              onClick={() => handleToggleJoinSession(session)}
                              className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded transition-colors flex items-center gap-1"
                              title="Hủy buổi hẹn khỏi lịch cá nhân"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hủy khỏi lịch</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. DƯỚI CÙNG: Các môn học & Ghép nhóm (Subjects & Group Study)            */}
        {/* ========================================================================= */}
        <section id="subject-section" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                  Các môn học & Ghép nhóm
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Bấm vào một môn học để xem ai đã đặt hẹn, vào giờ nào, ngày nào. Đăng lịch hẹn mới hoặc tham gia học cùng!
              </p>
            </div>

            {/* Nút "Đăng lịch hẹn học cùng" theo yêu cầu đề bài */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowAuthModal(true);
                  showToast('Vui lòng đăng nhập để đăng lịch hẹn học cùng!');
                  return;
                }
                setNewSubjectId(selectedSubjectId);
                setShowCreateSessionModal(true);
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-xl border border-amber-300 shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span>Đăng lịch hẹn học cùng</span>
            </button>
          </div>

          {/* Subject Horizontal Selector / Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {INITIAL_SUBJECTS.map((subject) => {
              const isSelected = selectedSubjectId === subject.id;
              const count = sessions.filter((s) => s.subjectId === subject.id).length;

              return (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`p-3 rounded-2xl text-center flex flex-col items-center justify-center gap-2 transition-all border ${
                    isSelected
                      ? 'bg-sky-100/80 border-sky-300 text-sky-900 shadow-xs ring-2 ring-sky-200'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-white text-sky-700 shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {renderSubjectIcon(subject.iconName)}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      {subject.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {count} lịch hẹn
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Subject Information Bar */}
          <div className="bg-sky-50/60 rounded-2xl p-4 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-700 flex items-center justify-center">
                {renderSubjectIcon(currentSubjectObj.iconName)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Môn {currentSubjectObj.name}
                </h3>
                <p className="text-xs text-slate-600">
                  {currentSubjectObj.description}
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-sky-900 bg-white px-3 py-1.5 rounded-xl border border-sky-200/80 shrink-0">
              {subjectSessions.length} lịch hẹn đang mở
            </div>
          </div>

          {/* List of Study Sessions for this Subject */}
          <div className="space-y-4">
            {subjectSessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Chưa có lịch hẹn nào cho môn {currentSubjectObj.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto mb-5">
                  Hãy là người đầu tiên đăng lịch học chung môn {currentSubjectObj.name} để tìm bạn học cùng tối nay!
                </p>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setShowAuthModal(true);
                      return;
                    }
                    setNewSubjectId(currentSubjectObj.id);
                    setShowCreateSessionModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors border border-amber-300"
                >
                  + Đăng lịch hẹn môn {currentSubjectObj.name} ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectSessions.map((session) => {
                  const isPast = checkIsPast(session.date, session.time);
                  const isJoined = currentUser && session.attendeeIds.includes(currentUser.id);

                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-sky-200 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Student Info & Date/Time */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={session.creatorAvatar}
                              alt={session.creatorName}
                              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {session.creatorName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {session.creatorGrade}
                              </p>
                            </div>
                          </div>

                          {/* Star indicator for this session date */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                              isPast
                                ? 'bg-sky-100/70 border-sky-200 text-sky-600'
                                : 'bg-amber-100/80 border-amber-200 text-amber-600'
                            }`}
                            title={isPast ? 'Lịch đã qua (Ngôi sao Xanh nhạt)' : 'Lịch hôm nay / tương lai (Ngôi sao Vàng)'}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isPast
                                  ? 'fill-sky-200 text-sky-500'
                                  : 'fill-amber-300 text-amber-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Date and Time badge */}
                        <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>{session.time}</span>
                            <span className="text-slate-400">·</span>
                            <span>{session.durationMinutes} phút</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatVietnameseDate(session.date)}</span>
                          </div>
                        </div>

                        {/* Title and notes */}
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 font-heading">
                          {session.title}
                        </h4>

                        {session.notes && (
                          <p className="text-xs text-slate-600 mb-3 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/60">
                            <span className="font-semibold text-amber-900">Ghi chú:</span> {session.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-sky-500" />
                            {session.meetingPlatform}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {session.attendeeIds.length} bạn đã đăng ký
                          </span>
                        </div>
                      </div>

                      {/* NÚT "HỌC CÙNG NHAU" THEO YÊU CẦU ĐỀ BÀI */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {/* Quick Message Button */}
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              setShowAuthModal(true);
                              return;
                            }
                            setActiveChatSession(session);
                            setShowChatModal(true);
                          }}
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                          title="Nhắn tin nhanh trao đổi trước khi học"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                          <span>Nhắn tin</span>
                        </button>

                        {/* Main "Học cùng nhau" Button */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveMeetSession(session);
                              setShowMeetPreviewModal(true);
                            }}
                            className="px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-100/90 hover:bg-sky-200 rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5"
                            title="Mở liên kết phòng gặp mặt online"
                          >
                            <Video className="w-3.5 h-3.5 text-sky-600" />
                            <span>Mở phòng Meet</span>
                          </button>

                          <button
                            onClick={() => handleToggleJoinSession(session)}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border shadow-xs ${
                              isJoined
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-amber-200 hover:bg-amber-300 text-slate-900 border-amber-300'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isJoined ? 'fill-amber-400 text-amber-700' : 'text-slate-900'}`} />
                            <span>{isJoined ? 'Đã lưu lịch' : 'Học cùng nhau'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-heading">Hate Study</span>
            <span>· Nền tảng học tập & ghép nhóm nội bộ dành cho học sinh</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Phiên bản miễn phí</span>
            <span>·</span>
            <span>Tone màu Pastel Sky & Amber</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: ĐĂNG NHẬP / ĐĂNG KÝ TÀI KHOẢN RIÊNG TỪNG NGƯỜI DÙNG              */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-100 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                  HS
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  {authMode === 'login' ? 'Đăng nhập Hate Study' : 'Đăng ký tài khoản mới'}
                </h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Đăng ký mới
              </button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="ví dụ: minhanh, baolong, thuha..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
                  />
                </div>

                <button
                  onClick={() => handleLogin()}
                  className="w-full py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs"
                >
                  Đăng nhập vào tài khoản
                </button>

                {/* Quick login sample accounts for immediate demonstration */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2">
                    Chọn nhanh tài khoản học sinh mẫu:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {INITIAL_USERS.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleLogin(u.username)}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-left transition-colors flex items-center gap-2"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full bg-white border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {u.grade}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên của bạn
                  </label>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập (viết liền, không dấu)
                  </label>
                  <input
                    type="text"
                    required
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="nguyenvana"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lớp & Trường
                  </label>
                  <input
                    type="text"
                    value={registerGrade}
                    onChange={(e) => setRegisterGrade(e.target.value)}
                    placeholder="Lớp 11A2 - THPT Chu Văn An"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mục tiêu học tập / Giới thiệu ngắn
                  </label>
                  <input
                    type="text"
                    value={registerBio}
                    onChange={(e) => setRegisterBio(e.target.value)}
                    placeholder="Mục tiêu thi đậu đại học, thích học Toán..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 text-sm font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors border border-amber-300 shadow-xs"
                >
                  Tạo tài khoản & Đăng nhập ngay
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ĐĂNG LỊCH HẸN HỌC CÙNG                                          */}
      {/* ========================================================================= */}
      {showCreateSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Đăng lịch hẹn học cùng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lịch hẹn sẽ hiển thị trên bảng tin chung và đồng bộ vào Lịch cá nhân của bạn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateSessionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Chọn môn học */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Môn học
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value as SubjectId)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  {INITIAL_SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chủ đề buổi học */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chủ đề / Bài tập cần học cùng
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập đề thi thử Toán - Tích phân & Số phức"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Ngày và Giờ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày hẹn
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              {/* Thời lượng */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời lượng dự kiến
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[45, 60, 90, 120].map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => setNewDuration(dur)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        newDuration === dur
                          ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {dur} phút
                    </button>
                  ))}
                </div>
              </div>

              {/* Link phòng gặp mặt online (Google Meet) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Liên kết phòng học online (Google Meet / Zoom)
                  </label>
                  <button
                    type="button"
                    onClick={generateNewMeetLink}
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                  >
                    Tạo ngẫu nhiên link Google Meet
                  </button>
                </div>
                <input
                  type="url"
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* Ghi chú thêm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú cho bạn học (tài liệu, yêu cầu chuẩn bị...)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ví dụ: Đã có sẵn file PDF đề thi thử, mọi người vào cùng giải nhé!"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSessionModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-xl border border-amber-300 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>Đăng ngay lên bảng tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NHẮN TIN NHANH VỚI BẠN HỌC (Quick Chat)                          */}
      {/* ========================================================================= */}
      {showChatModal && activeChatSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sky-100 flex flex-col h-[520px] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-4 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeChatSession.creatorAvatar}
                  alt={activeChatSession.creatorName}
                  className="w-9 h-9 rounded-full bg-white border border-sky-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Trao đổi cùng {activeChatSession.creatorName}
                  </h4>
                  <p className="text-xs text-sky-700">
                    Môn: {activeChatSession.subjectName} · {activeChatSession.time} {formatVietnameseDate(activeChatSession.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              <div className="text-center my-1">
                <span className="text-[11px] bg-slate-200/70 text-slate-600 px-2.5 py-1 rounded-full">
                  Buổi học: {activeChatSession.title}
                </span>
              </div>

              {chatMessages
                .filter((m) => m.sessionId === activeChatSession.id)
                .map((msg) => {
                  const isMine = currentUser && msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-1.5 max-w-[85%]">
                        {!isMine && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-6 h-6 rounded-full mb-1"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            isMine
                              ? 'bg-sky-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

              {chatMessages.filter((m) => m.sessionId === activeChatSession.id).length === 0 && (
                <div className="text-center text-slate-400 text-xs py-8">
                  Chưa có tin nhắn nào. Bạn có thể gửi câu hỏi hoặc lời chào để bắt đầu ôn bài cùng nhau!
                </div>
              )}
            </div>

            {/* Quick Prompts for Students */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() =>
                  setQuickMessageText('Chào bạn, tối nay mình tham gia học cùng với nhé!')
                }
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-800 whitespace-nowrap transition-colors"
              >
                👋 Chào bạn, mình tham gia với nhé!
              </button>
              <button
                onClick={() =>
                  setQuickMessageText('Bạn có file đề trước không cho mình xin với?')
                }
                className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-800 whitespace-nowrap transition-colors"
              >
                📄 Cho mình xin file đề nhé!
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                value={quickMessageText}
                onChange={(e) => setQuickMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!quickMessageText.trim()}
                className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHÒNG HỌC ONLINE / GẶP MẶT (Google Meet / Zoom Launcher)          */}
      {/* ========================================================================= */}
      {showMeetPreviewModal && activeMeetSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-heading">
                    Phòng học trực tuyến
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeMeetSession.meetingPlatform} · Môn {activeMeetSession.subjectName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMeetPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Card Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white text-center mb-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Sẵn sàng tham gia
              </div>

              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Video className="w-8 h-8 text-sky-300" />
              </div>

              <h4 className="text-base font-bold text-white mb-1">
                {activeMeetSession.title}
              </h4>
              <p className="text-xs text-slate-300">
                Tổ chức bởi: {activeMeetSession.creatorName} ({activeMeetSession.creatorGrade})
              </p>
              <p className="text-xs text-amber-300 mt-2 font-medium">
                Thời gian: {activeMeetSession.time} · {formatVietnameseDate(activeMeetSession.date)}
              </p>
            </div>

            {/* Meeting link copy & launch */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đường dẫn tham gia cuộc gặp mặt:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeMeetSession.meetingUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeMeetSession.meetingUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-xs text-sky-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Lưu ý khi học cùng nhau:
                </p>
                <p>• Hãy bật micro và chuẩn bị sẵn câu hỏi khó hoặc bài tập cần thảo luận.</p>
                <p>• Tôn trọng bạn học và giữ không khí học tập tích cực, vui vẻ.</p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleToggleJoinSession(activeMeetSession)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  {currentUser && activeMeetSession.attendeeIds.includes(currentUser.id)
                    ? '✓ Đã có trong lịch cá nhân'
                    : '+ Lưu vào lịch cá nhân của tôi'}
                </button>

                <a
                  href={activeMeetSession.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Mở Google Meet ngay</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
