// @flow
import React from 'react';

type Props = {
  children: React.Node
};

/**
 * The container for all screen. Currently without anything, don't even remember why I made it (Johannes).
 * But can be kept to have some common styling for all screens?
 */
const RgScreenContainer = (props: Props) => <div>{props.children}</div>;

export default RgScreenContainer;
