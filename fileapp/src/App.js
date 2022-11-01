import React, { useState } from "react";

function App() {
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [isDataProcessed, setIsDataProcessed] = useState(false);
  const [selectedFile, setSelectedFile] = useState();
  const [processedData, setProcessedData] = useState([]);
  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };

  const handleSubmission = async () => {
    //Step 1, we hit the server and ask... WHERE do I put this file?
    let uploadData = await getUploadData();
    let uploadID = uploadData.uploadID;
    let fileLocation = uploadData.fileLocation;

    //Step 2 we POST the file to AWS
    await uploadToAWS(fileLocation);

    //Step 3 we tell our server we are done with the upload
    let processedData = await tellServerComplete(uploadID);
    setIsDataProcessed(true);
    setProcessedData(processedData.results);
  };

  const getUploadData = () => {
    return new Promise((resolve) => {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      };
      fetch("http://localhost:5000/begin-upload", requestOptions)
        .then((response) => response.json())
        .then((data) => resolve(data));
    });
  };

  const uploadToAWS = (fileLocation) => {
    return new Promise((resolve) => {
      //Make put request with raw file as body
      const requestOptions = {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: selectedFile,
      };
      //Perform the upload
      fetch(fileLocation, requestOptions)
        .then((response) => {
          if (response.status === 200) resolve(true);
          else resolve(false);
        })
        .catch((error) => {
          console.log(error);
          resolve(false);
        });
    });
  };

  const tellServerComplete = (uploadID) => {
    return new Promise((resolve) => {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadID: uploadID }),
      };
      fetch("http://localhost:5000/process-upload", requestOptions)
        .then((response) => response.json())
        .then((data) => resolve(data));
    });
  };

  return (
    <div className="App">
      <h1>The File Uploader!</h1>

      <input type="file" name="file" onChange={changeHandler} />
      {isFilePicked ? (
        <p>Filename: {selectedFile.name} selected</p>
      ) : (
        <p>Select a file to show details</p>
      )}

      {isFilePicked && <button onClick={handleSubmission}>Submit</button>}
      {isDataProcessed && (
        <React.Fragment>
          <h1>Congrats!! We Uploaded the following records</h1>
          <ul>
            {processedData.map((record, index) => {
              return (
                <li key={index}>
                  {record.Name} {record.Age}
                </li>
              );
            })}
          </ul>
        </React.Fragment>
      )}
    </div>
  );
}

export default App;
