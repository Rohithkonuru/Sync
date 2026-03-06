/**
 * Type definitions for frontend (JavaScript JSDoc)
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [headline]
 * @property {string} [location]
 * @property {string} [bio]
 * @property {string} [phone]
 * @property {string} [profilePicture]
 * @property {string} [bannerPicture]
 * @property {'student'|'job_seeker'|'professional'|'recruiter'} userType
 * @property {string[]} skills
 * @property {Education[]} education
 * @property {Experience[]} experience
 * @property {Project[]} projects
 * @property {Certification[]} certifications
 * @property {string} [resumeUrl]
 * @property {'Male'|'Female'|'Prefer not to say'} [gender]
 * @property {ATSScore} [atsScore]
 * @property {string} [atsScoreUpdated]
 * @property {number} syncScore
 * @property {string} [syncScoreUpdated]
 * @property {number} growthScore
 * @property {string} [growthScoreUpdated]
 * @property {string[]} connections
 * @property {string[]} connectionRequests
 * @property {boolean} isActive
 * @property {string} [lastLogin]
 * @property {boolean} emailVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Education
 * @property {string} school
 * @property {string} degree
 * @property {string} [field]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {string} [description]
 */

/**
 * @typedef {Object} Experience
 * @property {string} title
 * @property {string} company
 * @property {string} [location]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {boolean} current
 * @property {string} [description]
 */

/**
 * @typedef {Object} Certification
 * @property {string} name
 * @property {string} issuer
 * @property {string} [issueDate]
 * @property {string} [expiryDate]
 * @property {string} [credentialId]
 * @property {string} [credentialUrl]
 * @property {string} [fileUrl]
 */

/**
 * @typedef {Object} Project
 * @property {string} name
 * @property {string} [description]
 * @property {string} [url]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {string[]} tools
 */

/**
 * @typedef {Object} ATSScore
 * @property {number} score
 * @property {Object} breakdown
 * @property {number} breakdown.skills
 * @property {number} breakdown.experience
 * @property {number} breakdown.education
 * @property {number} breakdown.keywords
 * @property {string[]} suggestions
 */

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} requirements
 * @property {string} responsibilities
 * @property {number} [salaryMin]
 * @property {number} [salaryMax]
 * @property {string} location
 * @property {'full_time'|'part_time'|'contract'|'internship'|'remote'} jobType
 * @property {string} [workMode]
 * @property {string} [experienceLevel]
 * @property {string} [educationLevel]
 * @property {string} [benefits]
 * @property {string[]} tags
 * @property {boolean} isRemote
 * @property {boolean} isActive
 * @property {string} postedBy
 * @property {string} companyName
 * @property {string} [companyDescription]
 * @property {string} [companyWebsite]
 * @property {string} companyLocation
 * @property {string} [companyIndustry]
 * @property {string} [companySize]
 * @property {'active'|'closed'|'draft'|'expired'} status
 * @property {string} [applicationDeadline]
 * @property {string[]} applicants
 * @property {number} views
 * @property {boolean} isFeatured
 * @property {boolean} isUrgent
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Application
 * @property {string} id
 * @property {string} jobId
 * @property {string} applicantId
 * @property {string} recruiterId
 * @property {string} fullName
 * @property {string} email
 * @property {string} [coverLetter]
 * @property {string} [contactEmail]
 * @property {string} [contactPhone]
 * @property {string} [portfolioUrl]
 * @property {string[]} skills
 * @property {number} [experienceYears]
 * @property {Object} [customFields]
 * @property {string} [resumeFileUrl]
 * @property {'submitted'|'seen'|'in_processing'|'shortlisted'|'accepted'|'rejected'} status
 * @property {boolean} isSeen
 * @property {string} [seenAt]
 * @property {StatusHistoryEntry[]} statusHistory
 * @property {string} appliedAt
 * @property {string} updatedAt
 * @property {Job} [job]
 * @property {User} [applicant]
 */

/**
 * @typedef {Object} StatusHistoryEntry
 * @property {string} status
 * @property {string} updatedAt
 * @property {string} updatedBy
 * @property {string} [note]
 */

/**
 * @typedef {Object} Connection
 * @property {string} id
 * @property {string} requesterId
 * @property {string} recipientId
 * @property {'pending'|'accepted'|'declined'} status
 * @property {string} [message]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {User} [requester]
 * @property {User} [recipient]
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} senderId
 * @property {string} receiverId
 * @property {string} content
 * @property {string} [fileUrl]
 * @property {string} [fileName]
 * @property {string} [fileType]
 * @property {number} [fileSize]
 * @property {boolean} isRead
 * @property {string} [readAt]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {User} [sender]
 * @property {User} [receiver]
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} message
 * @property {string} type
 * @property {string} [relatedJobId]
 * @property {string} [relatedUserId]
 * @property {boolean} isRead
 * @property {string} [readAt]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} [description]
 * @property {string} [website]
 * @property {string} [location]
 * @property {string} [industry]
 * @property {string} [size]
 * @property {number} [foundedYear]
 * @property {number} [employeeCount]
 * @property {string} [revenue]
 * @property {string} [logoUrl]
 * @property {boolean} isVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} authorId
 * @property {string} content
 * @property {string} [imageUrl]
 * @property {string[]} likes
 * @property {string[]} comments
 * @property {string[]} shares
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {User} [author]
 */

/**
 * @typedef {Object} UserActivity
 * @property {string} id
 * @property {string} userId
 * @property {string} activityType
 * @property {Object} [data]
 * @property {string} createdAt
 */

// API Response Types
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} data
 * @property {string} [message]
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} data
 * @property {Object} pagination
 * @property {number} pagination.skip
 * @property {number} pagination.limit
 * @property {number} pagination.total
 * @property {number} pagination.totalPages
 * @property {boolean} pagination.hasNext
 * @property {boolean} pagination.hasPrev
 * @property {number} pagination.currentPage
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {false} success
 * @property {string} message
 * @property {Object} [errors]
 */

// Form Types
/**
 * @typedef {Object} UserCreateForm
 * @property {string} email
 * @property {string} password
 * @property {string} firstName
 * @property {string} lastName
 * @property {'student'|'job_seeker'|'professional'|'recruiter'} userType
 * @property {string} [location]
 * @property {string} [headline]
 * @property {string} [bio]
 * @property {string} [phone]
 * @property {string[]} [skills]
 * @property {'Male'|'Female'|'Prefer not to say'} [gender]
 * @property {string} [companyName]
 * @property {string} [companyDescription]
 * @property {string} [companyWebsite]
 * @property {string} [companyLocation]
 * @property {string} [companyIndustry]
 * @property {string} [companySize]
 */

/**
 * @typedef {Object} UserUpdateForm
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [headline]
 * @property {string} [location]
 * @property {string} [bio]
 * @property {string} [phone]
 * @property {string} [profilePicture]
 * @property {string} [bannerPicture]
 * @property {string[]} [skills]
 * @property {'Male'|'Female'|'Prefer not to say'} [gender]
 */

/**
 * @typedef {Object} JobCreateForm
 * @property {string} title
 * @property {string} description
 * @property {string} requirements
 * @property {string} responsibilities
 * @property {number} [salaryMin]
 * @property {number} [salaryMax]
 * @property {string} location
 * @property {'full_time'|'part_time'|'contract'|'internship'|'remote'} jobType
 * @property {string} [workMode]
 * @property {string} [experienceLevel]
 * @property {string} [educationLevel]
 * @property {string} [benefits]
 * @property {string[]} [tags]
 * @property {boolean} [isRemote]
 * @property {string} [applicationDeadline]
 */

/**
 * @typedef {Object} ApplicationCreateForm
 * @property {string} [coverLetter]
 * @property {string} [contactEmail]
 * @property {string} [contactPhone]
 * @property {string} [portfolioUrl]
 * @property {string[]} [skills]
 * @property {number} [experienceYears]
 * @property {Object} [customFields]
 */

// Component Props Types
/**
 * @typedef {Object} BaseComponentProps
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @typedef {Object} LoadingProps
 * @property {boolean} loading
 * @property {'small'|'medium'|'large'} [size]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen
 * @property {Function} onClose
 * @property {string} [title]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'danger'|'ghost'} [variant]
 * @property {'small'|'medium'|'large'} [size]
 * @property {boolean} [disabled]
 * @property {boolean} [loading]
 * @property {Function} [onClick]
 * @property {'button'|'submit'|'reset'} [type]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @typedef {Object} InputProps
 * @property {string} [type]
 * @property {string} [placeholder]
 * @property {string} [value]
 * @property {Function} [onChange]
 * @property {string} [error]
 * @property {boolean} [required]
 * @property {boolean} [disabled]
 * @property {string} [className]
 */

// Context Types
/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {string|null} token
 * @property {Function} login
 * @property {Function} logout
 * @property {Function} register
 * @property {Function} updateUser
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} SocketContextType
 * @property {*} socket
 * @property {Notification[]} notifications
 * @property {number} unreadCount
 * @property {boolean} isConnected
 * @property {Function} sendNotification
 * @property {Function} markNotificationRead
 * @property {Function} setUnreadCount
 * @property {Function} refreshNotifications
 */

// Hook Types
/**
 * @typedef {Object} UseApiResult
 * @property {*} data
 * @property {boolean} loading
 * @property {string|null} error
 * @property {Function} refetch
 */

/**
 * @typedef {Object} UsePaginationResult
 * @property {Array} data
 * @property {boolean} loading
 * @property {string|null} error
 * @property {Object} pagination
 * @property {number} pagination.skip
 * @property {number} pagination.limit
 * @property {number} pagination.total
 * @property {number} pagination.totalPages
 * @property {boolean} pagination.hasNext
 * @property {boolean} pagination.hasPrev
 * @property {number} pagination.currentPage
 * @property {Function} next
 * @property {Function} prev
 * @property {Function} goToPage
 * @property {Function} setLimit
 */

// Utility Types
/**
 * @typedef {'asc'|'desc'} SortDirection
 * @typedef {string} SortField
 * @typedef {string|number|boolean|string[]} FilterValue
 * @typedef {Object.<string, FilterValue>} FilterOptions
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} [q]
 * @property {number} [skip]
 * @property {number} [limit]
 * @property {string} [sort]
 * @property {SortDirection} [order]
 * @property {FilterOptions} [filters]
 */

// Error Types
/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {string} [code]
 * @property {*} [details]
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field
 * @property {string} message
 */

// Constants
export const USER_TYPES = {
  STUDENT: 'student',
  JOB_SEEKER: 'job_seeker',
  PROFESSIONAL: 'professional',
  RECRUITER: 'recruiter',
};

export const JOB_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  REMOTE: 'remote',
};

export const APPLICATION_STATUSES = {
  SUBMITTED: 'submitted',
  SEEN: 'seen',
  IN_PROCESSING: 'in_processing',
  SHORTLISTED: 'shortlisted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const CONNECTION_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};
