import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProvideAuth from './components/auth/ProvideAuth';
import Home from './pages/Home';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Dashboard from './pages/Dashboard';
import Navigation from './components/common/Navigation';
import Groups from './pages/account/groups/Groups';
import Cameras from './pages/account/cameras/Cameras';
import CreateGroup from './pages/account/groups/CreateGroup';
import AlertNotifications from './components/notifications/AlertNotifications';
import Alerts from './components/notifications/Alerts';
import CameraMutate from './pages/account/cameras/CameraMutate';
import CameraConfiguration from './pages/account/cameras/CameraConfiguration';
import Videos from './pages/account/videos/Videos';
import VideoMutate from './pages/account/videos/VideoMutate';
import Footer from './components/common/Footer';
import Subscriptions from './pages/account/subscriptions/Subscriptions';
import SubscriptionMutate from './pages/account/subscriptions/SubscriptionMutate';
import ManageAccount from './pages/account/ManageAccount';
import Tags from './pages/account/tags/Tags';
import TagMutate from './pages/account/tags/TagMutate';
import Stats from './pages/account/stats/Stats';

function App() {
  return (
    <Router>
      <ProvideAuth>
        <Navigation/>
        <main>
          <AlertNotifications>
            <Alerts/>
            <Routes>
              <Route path="/" element={<PrivateRoute><Home/></PrivateRoute>}/>
              <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
              <Route path="/account" element={<PrivateRoute><ManageAccount/></PrivateRoute>}/>
              <Route path="/account/cameras" element={<PrivateRoute><Cameras/></PrivateRoute>}/>
              <Route path="/account/cameras/:cameraId" element={<PrivateRoute><CameraMutate/></PrivateRoute>}/>
              <Route path="/account/cameras/:cameraId/configuration" element={<PrivateRoute><CameraConfiguration/></PrivateRoute>}/>
              <Route path="/account/groups" element={<PrivateRoute><Groups/></PrivateRoute>}/>
              <Route path="/account/groups/:groupId" element={<PrivateRoute><CreateGroup/></PrivateRoute>}/>
              <Route path="/account/videos" element={<PrivateRoute><Videos/></PrivateRoute>}/>
              <Route path="/account/videos/:motionVideo/cameras/:cameraId" element={<PrivateRoute><VideoMutate/></PrivateRoute>}/>
              <Route path="/account/subscriptions" element={<PrivateRoute><Subscriptions/></PrivateRoute>}/>
              <Route path="/account/subscriptions/:id" element={<PrivateRoute><SubscriptionMutate/></PrivateRoute>}/>
              <Route path="/account/tags" element={<PrivateRoute><Tags/></PrivateRoute>}/>
              <Route path="/account/tags/:tagId" element={<PrivateRoute><TagMutate/></PrivateRoute>}/>
              <Route path="/account/stats" element={<PrivateRoute><Stats/></PrivateRoute>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/logout" element={<Logout/>}/>
            </Routes>
            <Footer/>
          </AlertNotifications>
        </main>
      </ProvideAuth>
    </Router>
  );
}

export default App;
