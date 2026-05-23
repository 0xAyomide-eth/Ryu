import { useState,useEffect } from 'react';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'
import {TokenContract, StakingMechContract , TokenContractABI , StakingMechContractABI} from './contractdeets'
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


  const [tokenBalance, setTokenBalance] = useState('0')
  const [stakedAmount, setStakedAmount] = useState('0')
  const [stakedStartTime, setStakedStartTime] = useState('0')
  const [stakedDuration, setStakedDuration] = useState('0')
  const [stakedApr, setStakedApr] = useState('0')
  const [hasActiveStake, setHasActiveStake] = useState(false)
  const [pendingRewards, setPendingRewards] = useState('0')
  const [stakingAmount, setStakingAmount] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(true)
  const [canClaim, setCanClaim] = useState(false)
  const [lastClaimTime, setLastClaimTime] = useState('0')

//function to getUserData

const fetchUserData = async () => {
  if (!address) return " "

    try{
      // Fetch token balance
      const balance = await readContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'balanceOf',
        args: [address],
      })
      setTokenBalance(balance.toString())

            // Fetch stake info
      const stake = await readContract(config, {
        address:  StakingMechContract,
        abi:  StakingMechContractABI,
        functionName: 'getStake',
        args: [address],
      })

     setStakedAmount(stake.amount?.toString() || '0')
      setStakedStartTime(stake.startTime?.toString() || '0')
      setStakedDuration(stake.lockDuration?.toString() || '0')
      setStakedApr(stake.apr?.toString() || '0')
      setHasActiveStake(stake.active || false)

      if (stake.active) {
        const rewards = await readContract(config, {
          address: StakingMechContract,
          abi: StakingMechContractABI,
          functionName: 'calculateReward',
          args: [address],
        })
        setPendingRewards(rewards.toString())
      } else {
        setPendingRewards('0')
      }
}catch(err){
  console.log(`error occured:${err.message}`)
}

const checkAllowance = async () => {
    if (!address) return
    
    try {
      const allowance = await readContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'allowance',
        args: [address, StakingMechContract],
      })
      
      setNeedsApproval(allowance === 0n || allowance.toString() === '0')
    } catch (error) {
      console.error('Error checking allowance:', error)
    }
  }

  
  const checkClaimEligibility = async () => {
    if (!address) return
    
    try {
      const lastClaim = await readContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'lastclaimed',
        args: [address],
      })
      
      setLastClaimTime(lastClaim.toString())
      
      const cooldown = await readContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'cooldown',
        args: [],
      })
      
      const now = Math.floor(Date.now() / 1000)
      const canClaimNow = now >= (Number(lastClaim) + Number(cooldown))
      setCanClaim(canClaimNow)
    } catch (error) {
      console.error('Error checking claim eligibility:', error)
    }
  }

  const handleApprove = async () => {
    if (!stakingAmount) {
      alert('Please enter an amount to approve')
      return
    }
    
    setIsLoading(true)
    try {
      const amountInWei = BigInt(parseFloat(stakingAmount) * 10**18)
      
      const hash = await writeContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'approve',
        args: [StakingMechContract, amountInWei],
      })
      
      await waitForTransactionReceipt(config, { hash })
      await checkAllowance()
      alert('Approval successful! You can now stake.')
    } catch (error) {
      console.error('Approval error:', error)
      alert('Approval failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

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
              {tokenBalance}
            </p>
          </div>
          <div className="container-1">
            <p className='container-1-text'>Staked Tokens:</p>
            <p className="container-Bal Staked-Token-Bal">
              {stakedAmount}
            </p>
          </div>
          <div className="container-1">
            <p className='container-1-text'>upcoming rewards:</p>
            <p className="container-Bal Upcoming-Token-Rewards">
              {pendingRewards}
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
