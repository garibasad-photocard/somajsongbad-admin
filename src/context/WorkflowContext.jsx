import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { AuthContext } from './AuthContext'

export const WorkflowContext = createContext(null)

export function WorkflowProvider({ children }) {
  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [notifications, setNotifications] = useState([])
  const { user, logout } = useContext(AuthContext)

  // Tab Visibility Listener for background updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchAssignments()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const fetchAssignments = async () => {
    try {
      setLoadingAssignments(true)
      const res = await api.get('/workflow')
      const mapped = res.data.map(a => {
        let assignees = a.assignees || [];
        if (assignees.length === 0 && a.assigneeName) {
          assignees = [{ id: a.assigneeId, name: a.assigneeName, isOvertime: false }];
        }
        return {
          id: a._id,
          title: a.title,
          instructions: a.description,
          categories: [a.category].filter(Boolean),
          newsPositions: a.newsPositions || [],
          priority: a.priority,
          deadline: a.deadline,
          assignees: assignees,
          assignedTo: assignees.length > 0 ? assignees[0] : null,
          assignedBy: a.assignerId ? { id: a.assignerId._id, name: a.assignerId.name, designation: '' } : null,
          status: a.status,
          type: a.status && a.status.startsWith('self_') ? 'self' : 'assigned',
          edition: a.edition || 'online',
          onlineTrack: a.onlineTrack || {},
          printTrack: a.printTrack || {},
          createdAt: a.createdAt,
          sourceUrl: a.sourceUrl,
          articleData: a.articleData,
          history: a.logs.map(l => ({ action: l.action, by: l.user, at: l.date, note: l.note }))
        }
      })
      setAssignments(mapped)
      // Save to localStorage as backup (safe - handles quota errors)
      try {
        localStorage.setItem('cms_assignments_cache', JSON.stringify(mapped))
      } catch (quotaErr) {
        // localStorage is full - clear old cache and try again
        try {
          localStorage.removeItem('cms_assignments_cache')
          localStorage.setItem('cms_assignments_cache', JSON.stringify(mapped))
        } catch {
          // Give up silently - cache is not critical
          console.warn('localStorage quota exceeded. Assignment cache disabled.')
        }
      }
    } catch (err) {
      console.error('Failed to fetch assignments', err)
      if (err.response && err.response.status === 401) {
        if (logout) {
          logout()
          alert('Session expired. Please log in again.')
        }
      }
      // Load from localStorage cache if API fails
      try {
        const cached = localStorage.getItem('cms_assignments_cache')
        if (cached) setAssignments(JSON.parse(cached))
      } catch {}
    } finally {
      setLoadingAssignments(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = async (text, assignmentId = null, type = 'system') => {
    const tempId = Date.now() + Math.random()
    setNotifications((prev) => [
      { id: tempId, text, time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }), read: false, assignmentId, type },
      ...prev,
    ])
    try {
      await api.post('/notifications', { text, assignmentId, type })
    } catch (err) {
      console.error(err)
    }
  }

  // Deadline Checker
  useEffect(() => {
    if (assignments.length === 0) return;
    
    const checkDeadlines = () => {
      const now = new Date();
      assignments.forEach(a => {
        if (!a.deadline) return;
        if (a.status === 'submitted' || a.status === 'approved' || a.status === 'published') return;
        
        const deadlineDate = new Date(a.deadline);
        const timeDiff = deadlineDate - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // If deadline is within 1 hour
        if (hoursDiff > 0.5 && hoursDiff <= 1) {
          const warnKey = `deadline_warned_1h_${a.id}`;
          if (!localStorage.getItem(warnKey)) {
            addNotification(`এলার্ম: "${a.title}" অ্যাসাইনমেন্টের ডেডলাইন শেষ হতে আর মাত্র ১ ঘণ্টার কম সময় বাকি!`, a.id, 'deadline_warning');
            localStorage.setItem(warnKey, 'true');
          }
        }
        
        // If deadline is within 30 mins
        if (hoursDiff > 0 && hoursDiff <= 0.5) {
          const warnKey30 = `deadline_warned_30m_${a.id}`;
          if (!localStorage.getItem(warnKey30)) {
            addNotification(`এলার্ম: "${a.title}" অ্যাসাইনমেন্টের ডেডলাইন শেষ হতে আর মাত্র ৩০ মিনিটের কম সময় বাকি!`, a.id, 'deadline_warning');
            localStorage.setItem(warnKey30, 'true');
          }
        }
        
        // If deadline is missed (within last 24h to avoid old spams)
        if (hoursDiff <= 0 && hoursDiff >= -24) {
          const missedKey = `deadline_missed_${a.id}`;
          if (!localStorage.getItem(missedKey)) {
            addNotification(`সতর্কতা: "${a.title}" অ্যাসাইনমেন্টের ডেডলাইন পার হয়ে গেছে! দয়া করে দ্রুত চেক করুন।`, a.id, 'deadline_warning');
            localStorage.setItem(missedKey, 'true');
          }
        }
      });
    };

    const checkSLA = () => {
      const now = new Date();
      assignments.forEach(a => {
        if (!a.onlineTrack?.workflowStage) return;
        const stage = a.onlineTrack.workflowStage;
        const isLocked = a.isLocked; // Ignore if someone is actively editing it
        if (stage === 'published' || stage === 'assignment_created' || isLocked) return;

        // Find the last time this stage was entered
        let lastStageDate = a.updatedAt || a.createdAt;
        if (a.onlineTrack.logs && a.onlineTrack.logs.length > 0) {
          const lastLog = a.onlineTrack.logs[a.onlineTrack.logs.length - 1];
          if (lastLog) {
            lastStageDate = lastLog.date;
          }
        }
        
        const timeDiffMins = (now - new Date(lastStageDate)) / (1000 * 60);

        let slaViolated = false;
        let stageName = '';
        
        if (['reporter_submitted', 'submitted', 'review', 'department_review'].includes(stage) && timeDiffMins > 15) {
          slaViolated = true;
          stageName = 'ডিপার্টমেন্ট কিউ';
        } else if (stage === 'news_management_editing' && timeDiffMins > 20) {
          slaViolated = true;
          stageName = 'NM ডেস্ক';
        } else if (stage === 'sent_to_proof' && timeDiffMins > 10) {
          slaViolated = true;
          stageName = 'প্রুফ ডেস্ক';
        }

        if (slaViolated) {
          const slaKey = `sla_warned_${a.id}_${stage}`;
          if (!localStorage.getItem(slaKey)) {
            addNotification(`SLA Alert: "${a.title}" নিউজটি ${stageName}-এ ${Math.floor(timeDiffMins)} মিনিট ধরে আটকে আছে!`, a.id, 'sla_warning');
            localStorage.setItem(slaKey, 'true');
          }
        }
      });
    };

    checkDeadlines(); // check immediately
    checkSLA();
    const interval = setInterval(() => {
      checkDeadlines();
      checkSLA();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [assignments]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await api.put('/notifications/read-all')
    } catch (err) {
      console.error(err)
    }
  }

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    try {
      await api.put(`/notifications/${id}/read`)
    } catch (err) {
      console.error(err)
    }
  }

  // Editor Assignment তৈরি
  const createAssignment = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.instructions,
        category: data.categories?.[0] || data.category || '',
        priority: data.priority,
        deadline: data.deadline,
        assignees: data.assignees || [],
        assigneeId: data.assignedTo?.id,
        assigneeName: data.assignedTo?.name,
        edition: data.edition || 'online',
        status: 'pending'
      }
      const res = await api.post('/workflow', payload)
      await fetchAssignments()
      addNotification(`নতুন assignment: "${data.title}"`, res.data._id)
      return res.data
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Self Assignment তৈরি — Approval দরকার
  const createSelfAssignment = async (data, reporter) => {
    try {
      const payload = {
        title: data.title,
        description: data.instructions,
        category: data.categories?.[0] || data.category || '',
        priority: data.priority,
        deadline: data.deadline,
        assignees: [{ id: reporter.id || reporter._id, name: reporter.name, designation: reporter.designation || '' }],
        assigneeId: reporter.id || reporter._id,
        assigneeName: reporter.name,
        edition: data.edition || 'online',
        status: 'self_pending',
        requestMultimedia: data.requestMultimedia,
        multimediaContentType: data.multimediaContentType,
        multimediaPlatform: data.multimediaPlatform,
        multimediaScriptNote: data.multimediaScriptNote,
        multimediaThumbnailNote: data.multimediaThumbnailNote
      }
      const res = await api.post('/workflow', payload)
      await fetchAssignments()
      addNotification(`${reporter.name} Self Assignment approval চেয়েছেন: "${data.title}"`, res.data._id)
      return res.data
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const updateStatus = async (id, status, note = '', by = 'ব্যবহারকারী') => {
    try {
      await api.put(`/workflow/${id}/status`, { status, note })
      await fetchAssignments()
    } catch (err) {
      console.error(err)
    }
  }

  const updateAssigneeTaskStatus = async (id, assigneeId, status, note = '', contentId = null) => {
    try {
      await api.put(`/workflow/${id}/assignee-status`, { userId: assigneeId, status, note, contentId })
      await fetchAssignments()
    } catch (err) {
      console.error('updateAssigneeTaskStatus error:', err)
      const msg = err.response?.data?.message || err.message || 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে'
      alert(`❌ ${msg}`)
    }
  }

  const deleteAssignment = async (id) => {
    try {
      await api.delete(`/workflow/${id}`)
      await fetchAssignments()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ─── Online Track Update ───
  const updateOnlineTrack = async (id, updateData) => {
    try {
      await api.put(`/workflow/${id}/online-track`, updateData)
      await fetchAssignments()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ─── Print Track Update ───
  const updatePrintTrack = async (id, updateData) => {
    try {
      await api.put(`/workflow/${id}/print-track`, updateData)
      await fetchAssignments()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // ─── Multimedia Track Update ───
  const updateMultimediaTrack = async (id, updateData) => {
    try {
      await api.put(`/workflow/${id}/multimedia-track`, updateData)
      await fetchAssignments()
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Publish করলে news-sort এ যাবে
  const publishArticle = async (id, articleData) => {
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== id) return a
      return {
        ...a,
        status: 'published',
        articleData,
        history: [...a.history, { action: 'published', by: 'এডিটর', at: new Date().toISOString(), note: '' }]
      }
    }))
    addNotification(`"${assignments.find(a => a.id === id)?.title}" প্রকাশিত হয়েছে`, id)
  }

  // প্রকাশিত নিউজে কারেকশন পাঠানো — শুধুমাত্র চিফ এডিটর
  const sendCorrection = (id, note = '', by = 'চিফ এডিটর') => {
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== id) return a
      const updated = {
        ...a,
        status: 'correction_needed',
        history: [...a.history, {
          action: 'correction_needed',
          by,
          at: new Date().toISOString(),
          note: note || 'কারেকশন প্রয়োজন।',
        }],
      }
      addNotification(`"${a.title}" — চিফ এডিটর কারেকশন চেয়েছেন`, id)
      return updated
    }))
  }

  const reassign = (id, journalist, note = '') => {
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== id) return a
      return {
        ...a,
        assignedTo: journalist,
        status: 'pending',
        history: [...a.history, {
          action: 'reassigned', by: 'রাকিব খান',
          at: new Date().toISOString(),
          note: `Re-assigned to ${journalist.name}. ${note}`
        }]
      }
    }))
    addNotification(`"${assignments.find(a => a.id === id)?.title}" re-assign হয়েছে — ${journalist.name}`, id)
  }

  return (
    <WorkflowContext.Provider value={{
        assignments,
        loadingAssignments,
        fetchAssignments,
        createAssignment,
        createSelfAssignment,
        updateStatus,
        updateAssigneeTaskStatus,
        updateOnlineTrack,
        updatePrintTrack,
        updateMultimediaTrack,
        sendCorrection,
        deleteAssignment,
        publishArticle,
        reassign,
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        addNotification,
        journalists: []
      }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export const useWorkflow = () => useContext(WorkflowContext)
