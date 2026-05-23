import { useState, useEffect } from 'react';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { config } from './walletconfig' // ADD THIS IMPORT
import { TokenContract, StakingMechContract, TokenContractABI, StakingMechContractABI } from './contractdeets'
import './App.css'

function App() {

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

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!address) return

    try {
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
        address: StakingMechContract,
        abi: StakingMechContractABI,
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
    } catch (err) {
      console.log(`error occurred: ${err.message}`)
    }
  }

  // Check allowance function
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

  // Check claim eligibility function
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

  // ADD THIS MISSING FUNCTION - Handle Claim Tokens
  const handleClaimTokens = async () => {
    setIsLoading(true)
    try {
      const hash = await writeContract(config, {
        address: TokenContract,
        abi: TokenContractABI,
        functionName: 'claim',
        args: [],
      })

      await waitForTransactionReceipt(config, { hash })
      await fetchUserData()
      await checkClaimEligibility()
      alert('Tokens claimed successfully!')
    } catch (error) {
      console.error('Claim error:', error)
      alert('Claim failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!stakingAmount) {
      alert('Please enter an amount to approve')
      return
    }

    setIsLoading(true)
    try {
      const amountInWei = BigInt(parseFloat(stakingAmount) * 10 ** 18)

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

  const handleStake = async () => {
    if (!stakingAmount) {
      alert('Please enter an amount')
      return
    }

    if (!selectedDuration) {
      alert('Please select staking duration (30, 60, or 90 days)')
      return
    }

    setIsLoading(true)

    try {
      const amountInWei = BigInt(parseFloat(stakingAmount) * 10 ** 18)
      let hash

      if (selectedDuration === 30) {
        hash = await writeContract(config, {
          address: StakingMechContract,
          abi: StakingMechContractABI,
          functionName: 'stake30',
          args: [amountInWei],
        })
      } else if (selectedDuration === 60) {
        hash = await writeContract(config, {
          address: StakingMechContract,
          abi: StakingMechContractABI,
          functionName: 'stake60',
          args: [amountInWei],
        })
      } else if (selectedDuration === 90) {
        hash = await writeContract(config, {
          address: StakingMechContract,
          abi: StakingMechContractABI,
          functionName: 'stake90',
          args: [amountInWei],
        })
      } else {
        alert('Please select 30, 60, or 90 days')
        return
      }

      await waitForTransactionReceipt(config, { hash })
      await fetchUserData()
      await checkAllowance()

      setStakingAmount('')
      setSelectedDuration(null)
      alert('Staking successful!')
    } catch (error) {
      console.error('Staking error:', error)
      alert('Staking failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnstake = async () => {
    setIsLoading(true)
    try {
      const hash = await writeContract(config, {
        address: StakingMechContract,
        abi: StakingMechContractABI,
        functionName: 'unstake',
        args: [],
      })

      await waitForTransactionReceipt(config, { hash })
      await fetchUserData()
      alert('Unstaking successful!')
    } catch (error) {
      console.error('Unstaking error:', error)
      alert('Unstaking failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const shortenAddy = (addy) => {
    if (!addy) return " "
    return `${addy.slice(0, 6)}...${addy.slice(-4)}`
  }

  const getTimeRemaining = () => {
    if (!hasActiveStake || stakedStartTime === '0') return ''
    const now = Math.floor(Date.now() / 1000)
    const unlockTime = Number(stakedStartTime) + Number(stakedDuration)
    const remaining = unlockTime - now
    if (remaining <= 0) return 'Ready to unstake!'
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    return `${days}d ${hours}h remaining`
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData()
      checkAllowance()
      checkClaimEligibility()
    }
  }, [isConnected, address]) // Remove fetchUserData from deps to avoid infinite loop

  // Countdown timer for claim
  useEffect(() => {
    if (!canClaim && lastClaimTime !== '0') {
      const interval = setInterval(() => {
        const cooldownSeconds = 24 * 60 * 60
        const now = Math.floor(Date.now() / 1000)
        const timeLeft = (Number(lastClaimTime) + cooldownSeconds) - now

        if (timeLeft <= 0) {
          setCanClaim(true)
          clearInterval(interval)
        } else {
          const hours = Math.floor(timeLeft / 3600)
          const minutes = Math.floor((timeLeft % 3600) / 60)
          const seconds = timeLeft % 60
          const countdownElem = document.getElementById('countdown')
          if (countdownElem) {
            countdownElem.textContent = `${hours}h ${minutes}m ${seconds}s`
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [canClaim, lastClaimTime])

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
              <button onClick={() => connect({ connector: injected() })}>Connect Wallet</button>
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
            <p>Claim 100 RYU (Every 24 hours)</p>
            <button
              className="claim-tokens-btn"
              onClick={handleClaimTokens}
              disabled={!isConnected || isLoading || !canClaim}
            >
              {!isConnected ? 'Connect Wallet First' :
                isLoading ? 'Processing...' :
                  !canClaim ? 'Wait 24 hours' : 'Claim Tokens'}
            </button>
            {lastClaimTime !== '0' && !canClaim && isConnected && (
              <p style={{ fontSize: '12px', marginTop: '5px' }}>
                ⏰ You can claim again in <span id="countdown"></span>
              </p>
            )}
          </div>

          <div className="stake-window">
            <p>Stake RYU Tokens</p>

            <input
              type="text"
              placeholder='Enter staking amount'
              name='staking-amount'
              value={stakingAmount}
              onChange={(e) => setStakingAmount(e.target.value)}
              disabled={!isConnected || isLoading || hasActiveStake}
            />

            <div className="staking-duration">
              <button
                className="days"
                onClick={() => !hasActiveStake && setSelectedDuration(30)}
              >
                30 days (8% APR)
              </button>
              <button
                className={`days ${selectedDuration === 60 ? 'active' : ''}`}
                onClick={() => !hasActiveStake && setSelectedDuration(60)}
                disabled={hasActiveStake}
              >
                60 days (8% APR)
              </button>
              <div
                className={`days ${selectedDuration === 90 ? 'active' : ''}`}
                onClick={() => !hasActiveStake && setSelectedDuration(90)}
              >
                90 days (12% APR)
              </div>
            </div>

            {hasActiveStake && (
              <p style={{ color: 'orange', textAlign: 'center', fontSize: '12px', margin: '10px 0' }}>
                You already have an active stake! Unstake first to stake more.
              </p>
            )}

            {!hasActiveStake && selectedDuration && (
              <p style={{ color: 'green', textAlign: 'center', fontSize: '12px', margin: '10px 0' }}>
                {selectedDuration} day staking with {selectedDuration === 30 ? '8' : selectedDuration === 60 ? '10' : '12'}% APR selected
              </p>
            )}

            <div className="button-area">
              {needsApproval && !hasActiveStake ? (
                <button
                  onClick={handleApprove}
                  disabled={!isConnected || isLoading || !stakingAmount}
                >
                  {isLoading ? 'Approving...' : 'Approve Tokens'}
                </button>
              ) : !hasActiveStake && (
                <button
                  onClick={handleStake}
                  disabled={!isConnected || isLoading || !stakingAmount || !selectedDuration}
                >
                  {isLoading ? 'Staking...' : 'Stake'}
                </button>
              )}

              <button
                onClick={handleUnstake}
                disabled={!isConnected || isLoading || !hasActiveStake}
              >
                {isLoading ? 'Processing...' : 'Unstake'}
              </button>
            </div>

            {hasActiveStake && (
              <div style={{ marginTop: '15px', fontSize: '12px', textAlign: 'center' }}>
                <p>🔒 Locked until: {new Date((Number(stakedStartTime) + Number(stakedDuration)) * 1000).toLocaleString()}</p>
                <p>📈 APR: {stakedApr}%</p>
                <p>💰 Staked Amount: {stakedAmount}</p>
                <p>⏰ {getTimeRemaining()}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default App