import React, { useState } from "react";

function App() {
  const [isFilePicked, setIsFilePicked] = useState(false);
  const [isUserPicked, setIsUserPicked] = useState(false);
  const [isDataProcessed, setIsDataProcessed] = useState(false);
  const [selectedFile, setSelectedFile] = useState();
  const [processedData, setProcessedData] = useState([]);
  const [username, setUsername] = useState('')
  const changeFileHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsFilePicked(true);
  };
  const getS3FilePath = () => `${username}/${selectedFile.name}`

  const changeUserHandler = (event) => {
    setUsername(event.target.value);
    setIsUserPicked(true);
  };

  const handleSubmission = async () => {
    //Step 1, we hit the server and ask... WHERE do I put this file?
    let uploadData = await getUploadData();
    let uploadID = uploadData.uploadID; // Artificially created, purpose uncertain
    let s3FileUrlEndpoint = uploadData.fileLocation;

    //Step 2 we POST the file to AWS
    await uploadToAWS(s3FileUrlEndpoint);

    //Step 3 we tell our server we are done with the upload
    const processedData = await tellServerComplete(uploadID);
    if (processedData) {
    setIsDataProcessed(true);
    setProcessedData(processedData.results);
    } else {
      console.error('Eror: Could not retrieve the file from s3')
    }
  };

  const getUploadData = () => {
    return new Promise(async (resolve) => {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          s3FilenamePath: getS3FilePath(),
          username: username,
        }),
      };
      const fetch = window.fetch
      fetch(`/begin-upload`, requestOptions)
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          return resolve(data)
        })
        .catch((err) => {
          console.log('Caught fetch POST error: ', err)
        })
      // const data = JSON.stringify({
      //   fileName: selectedFile.name,
      //   fileType: selectedFile.type,
      // });
      // const response = await axios.post('/begin-upload', data, {
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // })

    });
  };

  const uploadToAWS = (s3FileUrlEndpoint) => {
    return new Promise((resolve) => {
      //Make put request with raw file as body
      const requestOptions = {
        method: "PUT",
        headers: { "Content-Type": "multipart/form-data" },
        body: selectedFile,
      };
      //Perform the upload
      const fetch = window.fetch
      fetch(s3FileUrlEndpoint, requestOptions)
        .then((response) => {
          if (response.status === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch((error) => {
          console.log('caught error in uploadToAWS(): ', error);
          resolve(false);
        });
    });
  };

  const tellServerComplete = (uploadID) => {
    return new Promise((resolve) => {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
            { uploadID: uploadID,
              s3FilenamePath: getS3FilePath(),
            }
        ),
      };
      const fetch = window.fetch;
      fetch("/process-upload", requestOptions)
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          resolve(data)
        })
          .catch(err => {
            console.log('Exception in /process-upload POST: ', err)
          })
    });
  };

  return (
    <div className="App">
      <h1>The File Uploader!</h1>

      Select file from compouter: <input type="file" name="file" onChange={changeFileHandler} />
      <br/>Assign a user name: <input name="user" onChange={changeUserHandler} />
      {isFilePicked ? (
        <p>Filename: {selectedFile.name} selected</p>
      ) : (
        <p>Select a file to show details</p>
      )}

      {isUserPicked ? (
        <p>User: {username} selected</p>
      ) : (
        <p>Select a user name</p>
      )}

      {isFilePicked && isUserPicked && <button onClick={handleSubmission}>Submit</button>}
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
