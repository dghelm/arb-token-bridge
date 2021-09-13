import React, { useContext, useState } from 'react'

import Loader from 'react-loader-spinner'
import { useLatest } from 'react-use'

import { useAppState } from '../../state'
import { PendingWithdrawalsLoadedState } from '../../util'
import { BridgeContext } from '../App/App'
import { Button } from '../common/Button'
import { NetworkSwitchButton } from '../common/NetworkSwitchButton'
import { StatusBadge } from '../common/StatusBadge'
import { NetworkBox } from './NetworkBox'

const TransferPanel = (): JSX.Element => {
  const {
    app: {
      pwLoadedState,
      changeNetwork,
      selectedToken,
      isDepositMode,
      networkDetails,
      pendingTransactions,
      arbTokenBridgeLoaded,
      arbTokenBridge: { eth, token, bridgeTokens }
    }
  } = useAppState()

  const bridge = useContext(BridgeContext)
  // const [tokeModalOpen, setTokenModalOpen] = useState(false)
  const latestEth = useLatest(eth)
  const latestToken = useLatest(token)
  const latestNetworkDetails = useLatest(networkDetails)

  const [depositing, setDepositing] = useState(false)

  const [l1Amount, setl1Amount] = useState<string>('')
  const [l2Amount, setl2Amount] = useState<string>('')

  const deposit = async () => {
    setDepositing(true)
    try {
      const amount = isDepositMode ? l1Amount : l2Amount
      if (isDepositMode) {
        if (networkDetails?.isArbitrum === true) {
          await changeNetwork?.(networkDetails.partnerChainID)
          while (
            latestNetworkDetails.current?.isArbitrum ||
            !latestEth.current ||
            !arbTokenBridgeLoaded ||
            !bridge
          ) {
            await new Promise(r => setTimeout(r, 100))
          }
          await new Promise(r => setTimeout(r, 3000))
        }
        if (selectedToken) {
          // TODO allowed returns false even after approval
          if (!bridgeTokens[selectedToken.address]?.allowed) {
            await latestToken.current.approve(selectedToken.address)
          }
          latestToken.current.deposit(selectedToken.address, amount)
        } else {
          latestEth.current.deposit(amount)
        }
      } else {
        if (networkDetails?.isArbitrum === false) {
          await changeNetwork?.(networkDetails.partnerChainID)
          while (
            !latestNetworkDetails.current?.isArbitrum ||
            !latestEth.current ||
            !arbTokenBridgeLoaded ||
            !bridge
          ) {
            await new Promise(r => setTimeout(r, 100))
          }
          await new Promise(r => setTimeout(r, 3000))
        }
        if (selectedToken) {
          if (!bridgeTokens[selectedToken.address]?.allowed) {
            await latestToken.current.approve(selectedToken.address)
          }
          latestToken.current.withdraw(selectedToken.address, amount)
        } else {
          latestEth.current.withdraw(amount)
        }
      }
    } catch (ex) {
      console.log(ex)
    } finally {
      setDepositing(false)
    }
  }

  return (
    <>
      <div className="flex justify-between items-end gap-4 flex-wrap max-w-networkBox w-full mx-auto mb-4 min-h-10">
        <div>
          {pwLoadedState === PendingWithdrawalsLoadedState.LOADING && (
            <div>
              <StatusBadge showDot={false}>
                <div className="mr-2">
                  <Loader
                    type="Oval"
                    color="rgb(45, 55, 75)"
                    height={14}
                    width={14}
                  />
                </div>
                Loading pending withdrawals
              </StatusBadge>
            </div>
          )}
          {pwLoadedState === PendingWithdrawalsLoadedState.ERROR && (
            <div>
              <StatusBadge variant="red">
                Loading pending withdrawals failed
              </StatusBadge>
            </div>
          )}
        </div>
        {pendingTransactions?.length > 0 && (
          <StatusBadge>{pendingTransactions?.length} Processing</StatusBadge>
        )}
      </div>
      <div className="flex flex-col w-full max-w-networkBox mx-auto mb-8">
        <div className="flex flex-col">
          <NetworkBox
            isL1
            amount={l1Amount}
            setAmount={setl1Amount}
            className={isDepositMode ? 'order-1' : 'order-3'}
          />
          <div className="h-2 relative flex justify-center order-2 w-full">
            <div className="flex items-center justify-end relative w-full">
              <div className="absolute left-0 right-0 mx-auto flex items-center justify-center">
                <NetworkSwitchButton />
              </div>
            </div>
          </div>
          <NetworkBox
            isL1={false}
            amount={l2Amount}
            setAmount={setl2Amount}
            className={isDepositMode ? 'order-3' : 'order-1'}
          />
        </div>

        <div className="h-6" />
        {isDepositMode ? (
          <Button
            onClick={deposit}
            disabled={depositing || (isDepositMode && l1Amount === '')}
            isLoading={depositing}
          >
            Deposit
          </Button>
        ) : (
          <Button
            onClick={deposit}
            disabled={depositing || (!isDepositMode && l2Amount === '')}
            variant="navy"
            isLoading={depositing}
          >
            Withdraw
          </Button>
        )}
      </div>
    </>
  )
}

export { TransferPanel }