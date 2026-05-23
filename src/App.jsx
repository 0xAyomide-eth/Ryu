import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'
import './App.css'

function App() {

const BtnStyle = {
  color: "white",
  backgroundColor: "#111111",
  border: "none",
  outline: "none",
  cursor: "pointer",
  fontFamily: "'Poppins', sans-serif", // Added a fallback just in case
  letterSpacing: "1px",
  fontWeight: 600 // Numbers can stay as numbers in JS style objects
};

  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  //function to shorten the address

  const shortenAddy = (addy) => {
    if (!addy) return " "
    return `${addy.slice(0, 6)}...${addy.slice(-4)}`
  }

  return (
    <>
      <main className="dashboard">

        <div className="navbar">
          {isConnected ? (
            <>
              <p className="connectedAddy">{shortenAddy(address)}</p>
              <button onClick={() => disconnect()}>Disconnect wallet</button>
            </>
          ) : (
            <>
              <p className="connectedAddy">Not Connected</p>
              <button onClick={() => connect({ connector:injected() })}>Connect Wallet</button>
            </>
          )}
        </div>

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
            <button className="claim-tokens-btn">
              {isConnected ? 'Claim Tokens' : (<button onClick={() => connect({ connector:injected() })} style={BtnStyle}> Connect Wallet </button>)}
            </button>
          </div>
          <div className="stake-window">
            <p>Stack 10 tokens</p>

            <input type="text" placeholder='enter staking amount' name='staking-amount' />

            <input type="text" placeholder='enter days' name='staking-duration' />
            <div className="staking-duration">
              <div className="days">30 days</div>
              <div className="days">60 days</div>
              <div className="days">90 days</div>
            </div>
            <div className="button-area">
              <button disabled={!isConnected}>Stake</button>
              <button disabled={!isConnected}>Unstake</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default App
