import React, { Component } from 'react';
import web3 from './web3';
import lottery from './lottery';
import 'bootstrap/dist/css/bootstrap.css';

class App extends Component {
  state = {
    manager: '',
    currentAccount: '',
    message: '',
    bids: {
      Car: [],
      Phone: [],
      Computer: []
    },
    bidAmount: '',
    contractBalance: '',
    newOwner: ''
  };

  async componentDidMount() {
    try {
      const manager = await lottery.methods.manager().call();
      const currentAccount = (await web3.eth.requestAccounts())[0];
      const bids = {
        Car: await lottery.methods.getBids('Car').call(),
        Phone: await lottery.methods.getBids('Phone').call(),
        Computer: await lottery.methods.getBids('Computer').call()
      };
      this.setState({ manager, currentAccount, bids });
      if (!this.eventListenersSet) {
        this.setupEventListeners();
        this.eventListenersSet = true;
      }
        try {
          const currentAccount = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
          this.setState({ message: '', currentAccount });
        } catch (error) {
          this.setState({ message: 'Metamask has not connected yet' });
        }
    } catch (error) {
    this.setState({ message: 'Metamask is not installed' });
    }

    this.updateInterval = setInterval(() => this.updateBidsAndBalance(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval); // Clear interval on component unmount
  }

  updateBidsAndBalance = async () => {
    const bids = {
      Car: await lottery.methods.getBids('Car').call(),
      Phone: await lottery.methods.getBids('Phone').call(),
      Computer: await lottery.methods.getBids('Computer').call()
    };
    const contractBalance = await web3.eth.getBalance(lottery.options.address);
    this.setState({ bids, contractBalance: web3.utils.fromWei(contractBalance, 'ether') });
  };

  setupEventListeners() {
    window.ethereum.on('accountsChanged', (accounts) => {
      const currentAccount = accounts[0];
      this.setState({ currentAccount });
    });

    lottery.events.BidPlaced({
        fromBlock: 'latest'
    })
    .on('data', (event) => {
        console.log('Bid Event:', event);
    })
    .on('error', console.error);
  }
  
  bidOnItem = async (item) => {
    this.setState({ message: 'Placing your bid...' });
    const bidAmountInWei = web3.utils.toWei("0.01", 'ether');

    try {
      await lottery.methods.bid(item).send({
        from: this.state.currentAccount,
        value: bidAmountInWei
      });

      this.setState({ message: 'Bid placed successfully!' });
    } catch (error) {
      this.setState({ message: 'Bid failed: ' + error.message });
    }
  };

  pickWinners = async () => {
    this.setState({ message: 'Picking winners...' });

    try {
      await lottery.methods.pickWinners().send({ from: this.state.currentAccount });
      this.setState({ message: 'Winners have been picked!' });
    } catch (error) {
      this.setState({ message: 'Error: ' + error.message });
    }
  };

  amIWinner = async () => {
    this.setState({ message: 'Checking if you are a winner...' });

    try {
        const wins = await lottery.methods.checkMyWins().call({
            from: this.state.currentAccount
        });

        if (wins.length === 0) {
            this.setState({ message: 'You did not win anything.' });
        } else {
            this.setState({ message: `You won: ${wins}` });
        }
    } catch (error) {
        this.setState({ message: 'Error: ' + error.message });
    }
  };

  withdraw = async () => {
    this.setState({ message: 'Withdrawing funds...' });
  
    try {
      await lottery.methods.withdraw().send({ from: this.state.currentAccount });
      this.setState({ message: 'Funds withdrawn successfully.' });
    } catch (error) {
      this.setState({ message: 'Withdraw failed: ' + error.message });
    }
  };

  startNewLottery = async () => {
    this.setState({ message: 'Starting new lottery cycle...' });

    try {
        await lottery.methods.startNewLottery().send({ from: this.state.currentAccount });
        this.setState({ message: 'New lottery cycle started.' });
    } catch (error) {
        this.setState({ message: 'Failed to start new lottery cycle: ' + error.message });
    }
  };

  transferOwnership = async () => {
    this.setState({ message: 'Transferring ownership...' });

    try {
        await lottery.methods.transferOwnership(this.state.newOwner).send({ from: this.state.currentAccount });
        this.setState({ message: 'Ownership transferred.' });
    } catch (error) {
        this.setState({ message: 'Ownership transfer failed: ' + error.message });
    }
  };

  destroyContract = async () => {
    this.setState({ message: 'Destroying contract...' });

    try {
        await lottery.methods.destroyContract().send({ from: this.state.currentAccount });
        this.setState({ message: 'Contract destroyed.' });
    } catch (error) {
        this.setState({ message: 'Failed to destroy contract: ' + error.message });
    }
  };

  render() {
    return (
      <div className="text-center">
        <h2>Lottery-Ballot</h2>
        <div className="d-flex justify-content-center">
          {['Car', 'Phone', 'Computer'].map(item => (
            <div key={item} className="card mx-2" style={{ width: '18rem' }}>
              <div className="card-body">
                <h5 className="card-title">{item}</h5>
                <p className="card-text">Bids: {this.state.bids[item].length}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => this.bidOnItem(item)}
                  disabled={this.state.currentAccount === this.state.manager}
                >
                  Bid
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn btn-warning mx-2" onClick={this.pickWinners} disabled={this.state.currentAccount === this.state.manager} > Declare Winner</button>
          <button className="btn btn-info mx-2" onClick={this.amIWinner}>Am I Winner</button>
          <button className="btn btn-success mx-2" onClick={this.withdraw} disabled={this.state.currentAccount === this.state.manager} > Withdraw</button>
          <button className="btn btn-secondary mx-2" onClick={this.startNewLottery} disabled={this.state.currentAccount === this.state.manager}>Start New Lottery</button>
          <button className="btn btn-danger mx-2" onClick={this.destroyContract} disabled={this.state.currentAccount === this.state.manager}>Destroy Contract</button>
        </div>
        <div className="mt-4">
          <p>Current Account: {this.state.currentAccount}</p>
          <p>Contract Owner: {this.state.manager}</p>
          <p>Contract Balance: {this.state.contractBalance} ETH</p>
        </div>
        <div className="mt-4">
          <h5>{this.state.message}</h5>
        </div>
        <div>
          <input type="text" value={this.state.newOwner} onChange={event => this.setState({ newOwner: event.target.value })} placeholder="New Owner Address" />
          <button className="btn btn-secondary mx-2" onClick={this.transferOwnership} disabled={this.state.currentAccount !== this.state.manager}>Transfer Ownership</button>
        </div>
      </div>
    );
  }
}

export default App;
