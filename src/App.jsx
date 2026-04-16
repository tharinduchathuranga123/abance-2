import React, { useState } from "react";
import PreForm from "./PreForm";
import ApplicationForm from "./form/ApplicationForm";

function App() {
  const [userData, setUserData] = useState(null);

  if (!userData) {
    return <PreForm onVerified={(data) => setUserData(data)} />;
  }

  return <ApplicationForm preFilledData={userData} />;
}

export default App;