import React from 'react';
import {
    BooleanField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import DeleteButton from '../../components/DeleteButton';
import ObjectField from '../../components/ObjectField';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import UrlField from '../../components/URLField';
import { queryVersion } from '../../settings';

export const SubscriptionsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <SubscriptionsShowView {...props} />
        </ShowContextProvider>
    );
};

const SubscriptionsShowView = props => {
    const { record } = useRecordContext();
    return (
        <>
            <ShowView
                {...props}
                title={<ResourceTitle />}
                actions={<ResourceShowActions />}
            >
                <SimpleShowLayout>
                    <TextField source="id" label="ID" />
                    <TextField source="resource_path" label="Resource Path" />
                    <UrlField source="ws_href" label="WebSocket Address" />
                    <TextField
                        source="max_update_rate_ms"
                        label="Max Update Rate (ms)"
                    />
                    <ObjectField source="params" />
                    <SanitizedDivider />
                    <BooleanField source="persist" />
                    <BooleanField source="secure" />
                    {queryVersion() >= 'v1.3' && (
                        <BooleanField source="authorization" />
                    )}
                </SimpleShowLayout>
            </ShowView>
            {get(record, 'id') && (
                // Toolbar will override the DeleteButton resource prop
                <Toolbar resource="subscriptions" style={{ marginTop: 0 }}>
                    <DeleteButton id={get(record, 'id')} />
                </Toolbar>
            )}
        </>
    );
};

export default SubscriptionsShow;
