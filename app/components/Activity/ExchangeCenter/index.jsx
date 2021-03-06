const React = require("react");
const MUI = require('material-ui');
const Flex = require("../../Flex");
const PerfectScroll = require("../../PerfectScroll");
const PrizeStore = require('../../../stores/PrizeStore');
const ActivityAction = require('../../../actions/ActivityAction');
const PrizeItem = require('./PrizeItem');
const Link = require("react-router").Link;
const ActivityUserStore = require('../../../stores/ActivityUserStore');
const FilterBar = require('./FilterBar');
const Common = require('../../Common');
const NotificationAction = require('../../../actions/NotificationActions');
const LoginStore = require('../../../stores/LoginStore');
const ActivityEmailHelper = require('../../../helper/ActivityEmailHelper');
const UserStore = require('../../../stores/UserStore');

module.exports = React.createClass({
    baseUrl: "http://rhinobird.workslan",
    firstTime: true,
    getInitialState() {
        return {
            mode: "loading",
            prizes: [],
            column: 'exchanged_times',
            order: 'desc',
            showAfford: false,
            exchangingPrize: undefined,
            target: this.props.query.id
        }
    },
    componentDidMount() {
        PrizeStore.addChangeListener(this._prizeChanged);
        $.get(`/activity/prizes?column=${this.state.column}&&order=${this.state.order}`).then(data=>{
            ActivityAction.updatePrizes(data);
        });
    },
    componentWillUnmount(){
        PrizeStore.removeChangeListener(this._prizeChanged);
    },
    _prizeChanged(){
        this._sort(this.state.column, this.state.order, this.state.showAfford);
    },
    componentDidUpdate(prevProps, prevState) {
        if (this.firstTime && this.refs.target) {
            this._scrollTo(this.refs.target);
            this.firstTime = false;
            this._borderTransition(this.refs.target);
        }
    },
    render(){
        let currentUser = ActivityUserStore.getCurrentUser();
        let available = currentUser.point_available;
        let exchangeDialogActions = [
            <MUI.FlatButton
                label="Cancel"
                secondary={true}
                onTouchTap={this._handleExchangeDialogCancel}/>,
            <MUI.FlatButton
                label="Exchange"
                primary={true}
                onTouchTap={this._handleExchangeDialogSubmit}/>
        ];
        return <PerfectScroll style={{height: '100%', position:'relative', padding:24}}>
            {this.state.prizes.length > 0 ? <FilterBar onChange={this._sort}/> : undefined}
            <Flex.Layout wrap>
                {this.state.mode === 'loading' ?
                    <MUI.Paper style={{textAlign: "center", padding: 24, fontSize: "1.5em", width: '100%'}}>Loading</MUI.Paper> : undefined
                }
                {this.state.mode === 'view' && this.state.prizes.length === 0 ? <div style={{margin: '100px auto'}}><h4>Coming soon</h4></div> : undefined}
                {this.state.prizes.map(p => {
                    let display = !this.state.showAfford || p.price <= available;
                    let ref = this.state.target === p.id + '' ? 'target' : undefined;
                    return <MUI.Paper style={{flex: "1 1 400px",
                                            margin: 20,
                                            maxWidth: "50%",
                                            whiteSpace:'nowrap',
                                            textOverflow:'ellipsis',
                                            overflow:'hidden',
                                            position: 'relative',
                                            display: display ? '' : 'none',
                                            boxShadow: ref ? '0 1px 6px ' + muiTheme.palette.accent1Color : '0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24)',
                                            transition: 'box-shadow 5s'}} key={p.id} ref={ref}>
                        <PrizeItem prize={p} canAfford={p.price <= available} onExchange={this._onExchange}/>
                    </MUI.Paper>;
                })}
            </Flex.Layout>
            <MUI.Snackbar ref="exchangeSuccess" message={`Exchanged successfully.`} />
            <MUI.Dialog actions={exchangeDialogActions} title="Exchanging Prize" ref='exchangeDialog'>
                <Common.Display type='subhead'>Are you sure to exchange this prize? <p style={{color: muiTheme.palette.accent1Color, display: 'inline'}}>This action can not be revoked.</p></Common.Display><br/>
                <Common.Display type='subhead'>Your current point is <p style={{color: muiTheme.palette.primary1Color, display: 'inline'}}>{currentUser.point_available}</p>.</Common.Display><br/>
                <Common.Display type='subhead'>This prize will cost you <p style={{color: muiTheme.palette.accent1Color, display: 'inline'}}>{this.state.exchangingPrize && this.state.exchangingPrize.price}</p> point.</Common.Display><br/>
                <Common.Display type='subhead'>After this exchange, your point will be <p style={{color: muiTheme.palette.primary1Color, display: 'inline'}}>{this.state.exchangingPrize && (currentUser.point_available - this.state.exchangingPrize.price)}</p> point.</Common.Display>
            </MUI.Dialog>
            {
                ActivityUserStore.currentIsAdmin() ?
                    <Link to='create-prize'>
                        <MUI.FloatingActionButton style={{position:'fixed', right: 24, bottom: 24, zIndex:100}} iconClassName="icon-add"/>
                    </Link> : undefined
            }
        </PerfectScroll>
    },
    _sort(column, order, showAfford) {
        let _sort = undefined;
        if (column === 'price') {
            _sort = order === 'asc' ?
                (a, b) => {
                    if (a.price === b.price) {
                        return a.id - b.id;
                    } else {
                        return a.price - b.price;
                    }
                }
                : (a, b) => {
                    if (a.price === b.price) {
                        return a.id - b.id;
                    } else {
                        return b.price - a.price;
                    }
                }
        } else if (column === 'exchanged_times') {
            _sort = order === 'asc' ?
                (a, b) => {
                    if (a.exchanged_times === b.exchanged_times) {
                        return a.id - b.id;
                    } else {
                        return a.exchanged_times - b.exchanged_times;
                    }
                }
                : (a, b) => {
                    if (a.exchanged_times === b.exchanged_times) {
                        return a.id - b.id;
                    } else {
                        return b.exchanged_times - a.exchanged_times;
                    }
                };
        }
        this.setState({
            mode: 'view',
            prizes: PrizeStore.getPrizes(_sort),
            column: column,
            order: order,
            showAfford: showAfford
        });
    },
    _onExchange(prize) {
        this.setState({exchangingPrize: prize});
        this.refs.exchangeDialog.show();
    },
    _handleExchangeDialogCancel() {
        this.refs.exchangeDialog.dismiss();
    },
    _handleExchangeDialogSubmit() {
        ActivityAction.exchange(this.state.exchangingPrize.id,
            (data) => {
                this.refs.exchangeDialog.dismiss();
                this.refs.exchangeSuccess.show();

                let notifications = [];
                let currentUserName = LoginStore.getUser().realname;
                ActivityUserStore.getAdminIds().map(id => {
                    notifications.push({
                        users: [id],
                        content: {
                            content: `Exchanged prize ${data.name}`
                        },
                        email_subject: `[RhinoBird] ${currentUserName} exchanged prize ${data.name}`,
                        email_body: ActivityEmailHelper.construct_email(UserStore.getUser(id).realname,
                            `${currentUserName} exchanged prize <a href="${this.baseUrl}/platform/activity/prizes?id=${data.id}">${data.name}</a>`),
                        url: `/platform/activity/exchanges`
                    });
                });
                NotificationAction.sendNotifications(notifications);
            }
        );
    },
    _scrollTo(ref) {
        if (ref) {
            let self = this.getDOMNode();
            let target = ref.getDOMNode();
            let offsetTop = 0, offsetParent = target;
            while (offsetParent !== self && offsetParent !== null) {
                offsetTop += offsetParent.offsetTop;
                offsetParent = offsetParent.offsetParent;
            }
            self.scrollTop = offsetTop + target.offsetHeight / 2 - self.offsetHeight / 2;
        }
    },
    _borderTransition(ref) {
        if (ref) {
            let target = ref.getDOMNode();
            target.style.boxShadow = '0 1px 6px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.24)';
        }
    }
});
