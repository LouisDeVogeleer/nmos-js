import {
    Card,
    CardContent,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    List,
    ListItem,
    MenuItem,
    Switch,
    TextField,
    withStyles,
} from '@material-ui/core';
import { Title } from 'react-admin';
import {
    DNSSD_API,
    FRIENDLY_PARAMETERS,
    LOGGING_API,
    PAGING_LIMIT,
    QUERY_API,
    USE_RQL,
    disabledSetting,
    hiddenSetting,
    useSettingsContext,
} from '../settings';

const StyledListItem = withStyles(theme => ({
    root: {
        justifyContent: 'center',
    },
}))(ListItem);

const StyledTextField = withStyles(theme => ({
    root: {
        width: 450,
    },
}))(TextField);

const StyledDivider = withStyles(theme => ({
    root: {
        width: 450,
    },
}))(Divider);

const pagingLimits = [
    {
        value: 5,
        label: '5',
    },
    {
        value: 10,
        label: '10',
    },
    {
        value: 20,
        label: '20',
    },
    {
        value: 50,
        label: '50',
    },
    {
        value: 100,
        label: '100',
    },
];

const selectOnFocus = event => event.target.select();

const Settings = () => {
    const [values, setValues] = useSettingsContext();

    const handleTextChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };

    const handleBooleanChange = name => event => {
        setValues({ ...values, [name]: event.target.checked });
    };

    return (
        <div style={{ paddingTop: '24px' }}>
            <Card>
                <Title title={'Settings'} />
                <CardContent align="center">
                    <List>
                        {!hiddenSetting(QUERY_API) && (
                            <StyledListItem>
                                <StyledTextField
                                    label="Query API"
                                    variant="filled"
                                    value={values[QUERY_API]}
                                    onChange={handleTextChange(QUERY_API)}
                                    onFocus={selectOnFocus}
                                    disabled={disabledSetting(QUERY_API)}
                                    helperText="Used to show the registered Nodes and their sub-resources"
                                />
                            </StyledListItem>
                        )}
                        {!hiddenSetting(LOGGING_API) && (
                            <StyledListItem>
                                <StyledTextField
                                    label="Logging API"
                                    variant="filled"
                                    value={values[LOGGING_API]}
                                    onChange={handleTextChange(LOGGING_API)}
                                    onFocus={selectOnFocus}
                                    disabled={disabledSetting(LOGGING_API)}
                                    helperText="Used to show registry Logs"
                                />
                            </StyledListItem>
                        )}
                        {!hiddenSetting(DNSSD_API) && (
                            <StyledListItem>
                                <StyledTextField
                                    label="DNS-SD API"
                                    variant="filled"
                                    value={values[DNSSD_API]}
                                    onChange={handleTextChange(DNSSD_API)}
                                    onFocus={selectOnFocus}
                                    disabled={disabledSetting(DNSSD_API)}
                                    helperText="Used to show alternative Query APIs"
                                />
                            </StyledListItem>
                        )}
                        {!hiddenSetting(USE_RQL) && (
                            <StyledListItem>
                                <FormControl
                                    variant="filled"
                                    disabled={disabledSetting(USE_RQL)}
                                >
                                    <FormControlLabel
                                        label="RQL"
                                        control={
                                            <Switch
                                                checked={values[USE_RQL]}
                                                onChange={handleBooleanChange(
                                                    USE_RQL
                                                )}
                                                color="primary"
                                            />
                                        }
                                    />
                                    <FormHelperText variant="filled">
                                        Use Resource Query Language rather than
                                        basic query syntax
                                    </FormHelperText>
                                </FormControl>
                            </StyledListItem>
                        )}
                        <StyledDivider />
                        {!hiddenSetting(PAGING_LIMIT) && (
                            <StyledListItem>
                                <StyledTextField
                                    select
                                    label="Paging Limit"
                                    variant="filled"
                                    value={values[PAGING_LIMIT]}
                                    onChange={handleTextChange(PAGING_LIMIT)}
                                    margin="normal"
                                    disabled={disabledSetting(PAGING_LIMIT)}
                                    helperText="Applied to paginated API requests for list views"
                                >
                                    {pagingLimits.map(option => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </StyledTextField>
                            </StyledListItem>
                        )}
                        {!hiddenSetting(FRIENDLY_PARAMETERS) && (
                            <StyledListItem>
                                <FormControl
                                    variant="filled"
                                    disabled={disabledSetting(
                                        FRIENDLY_PARAMETERS
                                    )}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    values[FRIENDLY_PARAMETERS]
                                                }
                                                onChange={handleBooleanChange(
                                                    FRIENDLY_PARAMETERS
                                                )}
                                                color="primary"
                                            />
                                        }
                                        label="Friendly Names"
                                    />
                                    <FormHelperText>
                                        Show friendly names rather than API
                                        parameter values
                                    </FormHelperText>
                                </FormControl>
                            </StyledListItem>
                        )}
                    </List>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
