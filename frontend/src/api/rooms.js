import api from './axios.js';

export const createRoom = (data) => api.post('/rooms', data);
export const getMyRooms = () => api.get('/rooms/mine');
export const getRoom = (code) => api.get(`/rooms/${code}`);
export const joinRoom = (code, data) => api.post(`/rooms/${code}/join`, data || {});
export const deleteRoom = (code) => api.delete(`/rooms/${code}`);
export const updateMemberRole = (code, userId, role) =>
  api.put(`/rooms/${code}/members/${userId}/role`, { role });

// Files
export const getFiles = (code) => api.get(`/rooms/${code}/files`);
export const getFileContent = (code, fileId) => api.get(`/rooms/${code}/files/${fileId}`);
export const createFile = (code, data) => api.post(`/rooms/${code}/files`, data);
export const saveFile = (code, fileId, content) =>
  api.put(`/rooms/${code}/files/${fileId}`, { content });
export const deleteFile = (code, fileId) => api.delete(`/rooms/${code}/files/${fileId}`);
export const getVersions = (code, fileId) =>
  api.get(`/rooms/${code}/files/${fileId}/versions`);
export const restoreVersion = (code, fileId, versionId) =>
  api.post(`/rooms/${code}/files/${fileId}/versions/${versionId}/restore`);

// Execution
export const executeCode = (code, data) => api.post(`/rooms/${code}/execute`, data);
export const getExecutionHistory = (code) => api.get(`/rooms/${code}/executions`);

// Chat
export const getChatHistory = (code, params) =>
  api.get(`/rooms/${code}/messages`, { params });
