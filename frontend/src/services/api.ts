import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Assuming your NestJS backend runs on port 3000
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;