import {
  List,
  Datagrid,
  TextField,
  DateField,
  SelectField,
  ReferenceField,
  FunctionField,
} from "react-admin";
import { actionTypeChoices } from "../tickets/choices";
import type { ModeratorAction } from "../dataProvider";
import { IssueLink } from "../tickets/TicketIssues";

// GET /moderator_actions/me is scoped to the caller and always ordered
// created_at desc server-side, and takes no filter or sort parameter - so
// this list offers neither, and every column is marked unsortable rather
// than letting react-admin send a sort the API would silently ignore.
export function ActionList() {
  return (
    <List
      title="My moderation actions"
      sort={{ field: "created_at", order: "DESC" }}
      empty={false}
      exporter={false}
    >
      <Datagrid bulkActionButtons={false}>
        <TextField source="id" sortable={false} />
        <ReferenceField
          source="ticket_id"
          reference="tickets"
          link="show" // For now we only show tickets, We don't have editing form.
          sortable={false}
        >
          <TextField source="barcode" />
        </ReferenceField>
        {/* The status the action set on the ticket, or `comment`. */}
        <SelectField
          source="action_type"
          choices={actionTypeChoices}
          sortable={false}
        />
        {/* The comment, or the GitHub issue linked or unlinked. */}
        <FunctionField<ModeratorAction>
          label="Details"
          sortable={false}
          render={(action) => {
            if (action.issue) return <IssueLink issue={action.issue} />;
            const text = action.comment?.text ?? "";
            return text.length > 120 ? `${text.slice(0, 120)}…` : text;
          }}
        />
        <DateField source="created_at" showTime sortable={false} />
      </Datagrid>
    </List>
  );
}
