'use strict';

const React = require("react");
const RouteHandler = require("react-router").RouteHandler;
const mui = require("material-ui");

import MessageAction from '../../../../../actions/MessageAction';
import ChannelAction from '../../../../../actions/ChannelAction';
import LoginStore from '../../../../../stores/LoginStore';
import ChannelStore from '../../../../../stores/ChannelStore';
import OnlineStore from '../../../../../stores/OnlineStore';
import MessageStore from '../../../../../stores/MessageStore';
import UnreadStore from '../../../../../stores/MessageUnreadStore';
import IMConstants from '../../../../../constants/IMConstants';
import Flex from '../../../../Flex';

const { Menu, FontIcon, FlatButton } = mui;
const {Layout} = Flex;

require('./style.less');
module.exports = React.createClass({

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            _currentChannel : {},
            _onlineStatus : false,
            _imCurrentChannel : false,
            _hasUnread : false
        }
    },

    componentDidMount() {

        ChannelStore.on(IMConstants.EVENTS.CHANNEL_SELECT_PREFIX + this.props.Channel.backEndChannelId, this._onChannelSelect);
        ChannelStore.on(IMConstants.EVENTS.CHANNEL_DESELECT_PREFIX + this.props.Channel.backEndChannelId, this._onChannelDeselect);

        UnreadStore.on(IMConstants.EVENTS.CHANNEL_UNREAD_CHANGE_PREFIX + this.props.Channel.backEndChannelId, this._onUnreadChange);

        if (!this.props.Channel.isGroup) {
            OnlineStore.on(IMConstants.EVENTS.USER_ONLINE_PREFIX + this.props.Channel.channel.id, this._onUserOnlineChange);
        }
    },

    componentWillUnmount() {
        ChannelStore.removeEventListener(IMConstants.EVENTS.CHANNEL_SELECT_PREFIX + this.props.Channel.backEndChannelId, this._onChannelSelect);
        ChannelStore.removeEventListener(IMConstants.EVENTS.CHANNEL_DESELECT_PREFIX + this.props.Channel.backEndChannelId, this._onChannelDeselect);
        UnreadStore.removeEventListener(IMConstants.EVENTS.CHANNEL_UNREAD_CHANGE_PREFIX + this.props.Channel.backEndChannelId, this._onUnreadChange);
        if (!this.props.Channel.isGroup) {
            OnlineStore.removeEventListener(IMConstants.EVENTS.USER_ONLINE_PREFIX + this.props.Channel.channel.id, this._onUserOnlineChange);
        }
    },

    _onChannelSelect(channel) {
        this.setState({
            _imCurrentChannel : true,
            _currentChannel : channel
        })
    },

    _onChannelDeselect(channel) {
        this.setState({
            _imCurrentChannel : false,
            _currentChannel : ChannelStore.getCurrentChannel
        })
    },

    _onUserOnlineChange(myOnlineState) {
        this.setState({
            _onlineStatus : myOnlineState.online
        });
    },

    _onUnreadChange(myUnreadState) {
        this.setState({
            _hasUnread : myUnreadState.unread
        });
    },

    _onItemTap(item, e) {
        let currentChannel = ChannelStore.getCurrentChannel();
        if (!currentChannel || currentChannel.backEndChannelId !== item.backEndChannelId) {
            ChannelAction.changeChannel(item.backEndChannelId, LoginStore.getUser());
            this.context.router.transitionTo('/platform/im/talk/' + item.backEndChannelId);
        } else {
            console.log('change channel : ' + !currentChannel || currentChannel.backEndChannelId !== item.backEndChannelId)
        }
    },

    render() {
        let self = this;
        return (
            <div className="instant-message-channel-container">
                <FlatButton className={this.state._imCurrentChannel?'instant-message-channel-item-selected instant-message-channel-item ':'instant-message-channel-item '}  onTouchTap={self._onItemTap.bind(self, this.props.Channel)}>
                    <div style={{overflowX: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span className={ this.props.Channel.iconClassName}></span>
                        <span className={(this.props.Channel.isDirect && !self.state._onlineStatus)?'instant-message-channel-item-offline':''}>{ this.props.Channel.text}</span>
                    </div>
                </FlatButton>
                <span className={ this.state._hasUnread?'instant-message-channel-item-unread icon-message':''}></span>
            </div>
        );
    }
});