using System.Web.Http;
using System.Web.Http.Routing;

namespace WAPPAssignment
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Get, HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete) }
            );
        }
    }
}