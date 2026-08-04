using System.Collections.Generic;
using ReportReminder.Api.Core;
using ReportReminder.Api.Models;

namespace ReportReminder.Api.Services;

public interface IContactParserService
{
    Result<List<Contact>> ParseVCard(string text);
    Result<List<Contact>> ParseOutlookCsv(string text);
}
