import './App.css'

function App() {

  return (
    <>
<main className="dashboard">
  <div className="top-dashboard">
  <div className="container-1">
    <p className='container-1-text'>Token Balance:</p>
    <p className="container-Bal Token-Bal">
      0
    </p>
  </div>
  <div className="container-1">
    <p className='container-1-text'>Staked Tokens:</p>
    <p className="container-Bal Staked-Token-Bal">
      0
    </p>
  </div>
  <div className="container-1">
    <p className='container-1-text'>upcoming rewards:</p>
    <p className="container-Bal Upcoming-Token-Rewards">
      0
    </p>
  </div>
  </div>
  <div className="bottom-dashboard">
  <div className="faucet-claim">
    <p>Claim 100 RYU</p>
    <input type="text" placeholder='enter wallet address' />
    <button>Claim tokens</button>
  </div>
  <div className="stake-window">
    <p>Stack 10 tokens</p>
    <label htmlFor="staking-amount">enter staking amount</label>
    <input type="text" placeholder='enter staking amount' name='staking-amount'/>
    <label htmlFor="staking-duration">How many days to token</label>
    <input type="text" placeholder='enter days' name='staking-duration'/>
    <div className="staking-duration">
      <div>30 days</div>
      <div>60 days</div>
      <div>90 days</div>
    </div>
    <button>Stake Tokens</button>
  </div>
  </div>
</main>
    </>
  )
}

export default App
