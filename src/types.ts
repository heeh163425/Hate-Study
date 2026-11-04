export type SubjectId =
  | 'toan'
  | 'ly'
  | 'hoa'
  | 'anh'
  | 'van'
  | 'sinh'
  | 'tin'
  | 'su_dia';

export interface Subject {
  id: SubjectId;
  name: string;
  code: string;
  iconName: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  grade: string;
  bio?: string;
}

export interface StudySession {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorGrade: string;
  subjectId: SubjectId;
  subjectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  meetingUrl: string;
  meetingPlatform: 'Google Meet' | 'Zoom' | 'MS Teams';
  notes?: string;
  attendeeIds: string[]; // List of user IDs who booked / attend
  attendeeNames?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: string;
}
