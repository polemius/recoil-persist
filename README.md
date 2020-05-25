# Recoil Persist

Tiny module for [recoil](https://recoiljs.org) to store and sync state to `localStorage`.

```js
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { RecoilRoot } from 'recoil'
import { updateState, RecoilPersist } from 'recoil-logger'

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot initializeState={updateState}>
      <RecoilPersist />
      <App />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root'),
)
```

## Install

```
npm install --save-dev recoil-persist
```

or

```
yarn add --dev recoil-persist
```

Now you could add `RecoilPersist` to your app:

```diff
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { RecoilRoot } from "recoil";
+ import { updateState, RecoilPersist } from 'recoil-logger'

ReactDOM.render(
  <React.StrictMode>
-   <RecoilRoot>
+   <RecoilRoot initializeState={updateState}> {/* Pass `updateState` function to recoil */}
+      <RecoilPersist /> {/* Please add this line inside `RecoilRoot` scope */}
      <App />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);
```

To make it work you need to add `persistence_UNSTABLE` key to atom properties:

```diff
const counterState = atom({
  key: "count",
  default: 0,
+  persistence_UNSTABLE: {
+    type: 'count'
+  },
});
```

After this each changes in atoms will be store and sync to `localStorage`.

## Usage

```js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { RecoilRoot } from "recoil";
import { updateState, RecoilPersist } from 'recoil-logger'

ReactDOM.render(
  <React.StrictMode>
   <RecoilRoot initializeState={({set}) => {
       {/* Use `set` for initialize the state */}
       updateState({set}) {/* If the localStorage has stored state then init state will be overide */}
    }>
      <RecoilPersist />
      <App />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);
```

## Notes

This package use unstable hook `useTransactionObservation_UNSTABLE`. 
As far it will be stable the package will be updated with new API.
