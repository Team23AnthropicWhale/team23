# SafeCase                                                                                                                                                         
                                                                                                                                                                   
  Mobile-first case management for child protection field workers. Built for environments where internet access is unreliable or unavailable — cases are captured    
  on-device, encrypted at rest, and synced either to a server or directly between devices over Bluetooth.                                                          
                                                                                                                                                                     
 ## Core features

### Case management
Field workers record child protection cases using structured CPMS forms: 
consent, registration, assessment, case plan, review, and closure. 
Cases are stored locally and submitted to the central server when 
a connection is available.

### End-to-end encryption
Every case record is encrypted with AES-256-GCM before it touches storage 
or the wire. Keys are derived from the user's PIN and persisted in the device 
Keychain (iOS) or Keystore (Android) — never in plain text.

## Planned

### Bluetooth peer-to-peer sync
Direct device-to-device sync over Bluetooth Low Energy for environments 
with no server connection. Includes delta sync, conflict flagging, 
and verbal PIN pairing.

### Org-key distribution
Secure transfer of the organisation encryption key to new devices 
without internet access.

  ## Getting started                                                                                                                                                 
                  
  **Backend**
  ```sh
  cd backend
  cp .env.example .env                                                                                                                                               
  composer install
  php artisan key:generate                                                                                                                                           
  php artisan migrate --seed
  php artisan serve --host=0.0.0.0 --port=8000

  Frontend
  cd frontend
  npm install                                                                                                                                                        
  npx expo start
