import { useContext } from 'react';
import { AuthContext } from './Authcontext';

const useAuth = () => useContext(AuthContext);

export default useAuth;